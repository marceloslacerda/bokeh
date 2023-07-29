import fs from "fs"
import {join, resolve} from "path"

import {argv} from "yargs"
import express from "express"
import nunjucks from "nunjucks"

import * as sys from "./sys"

const app = express()

nunjucks.configure(".", {
  autoescape: true,
  express: app,
  noCache: true,
})

app.use("/static", express.static("build/"))
app.use("/assets", express.static("test/assets/"))
app.use("/cases", express.static("../tests/baselines/cross/"))

const js_path = (name: string): string => {
  return `/static/js/${name}.js`
}

const test = (main: string, title: string) => {
  return (run: boolean = false) => {
    return (_req: express.Request, res: express.Response) => {
      const js = (name: string) => js_path(name)
      res.render("test/devtools/test.html", {main, title, run, js})
    }
  }
}

type Base64 = string
type Report = {
  results: [string[], {failure: boolean, image?: Base64, image_diff?: Base64, reference?: Base64}][]
  metrics: {[key: string]: number[]}
}

function using_report(fn: (report: Report, req: express.Request, res: express.Response) => void) {
  return async (req: express.Request, res: express.Response) => {
    const platform = typeof req.query.platform == "string" ? req.query.platform : sys.platform
    switch (platform) {
      case "linux":
      case "macos":
      case "windows": {
        const report_path = join("test", "baselines", platform, "report.json")
        try {
          const json = await fs.promises.readFile(report_path, {encoding: "utf-8"})
          fn(JSON.parse(json), req, res)
        } catch {
          res.status(404).send("Report unavailable")
        }
        break
      }
      default:
        res.status(404).send("Invalid platform specifier")
    }
  }
}

const unit = test("unit.js", "Unit Tests")
const defaults = test("defaults.js", "Defaults Tests")
const integration = test("integration.js", "Integration Tests")

app.get("/unit", unit())
app.get("/defaults", defaults())
app.get("/integration", integration())

app.get("/unit/run", unit(true))
app.get("/defaults/run", defaults(true))
app.get("/integration/run", integration(true))

app.get("/integration/report", using_report(({results}, req, res) => {
  const full = req.query.full == ""
  res.render("test/devtools/report.html", {title: "Integration Tests Report", results, full})
}))

app.get("/integration/metrics", using_report(({metrics}, _, res) => {
  res.render("test/devtools/metrics.html", {title: "Integration Tests Metrics", metrics, js: js_path})
}))

app.get("/examples", async (_req, res) => {
  const dir = await fs.promises.opendir("examples")
  const entries = []
  for await (const dirent of dir) {
    if (!dirent.isDirectory())
      continue
    const {name} = dirent
    if (name.startsWith(".") || name.startsWith("_"))
      continue
    entries.push(name)
  }
  entries.sort()
  res.render("test/devtools/examples.html", {entries})
})

app.get("/examples/:name", async (req, res) => {
  const {name} = req.params
  const template = join("examples", name, `${name}.html`)
  try {
    const stat = await fs.promises.stat(template)
    if (stat.isFile()) {
      res.render(template)
      return
    }
  } catch {}
  res.status(404).send("No such example")
})

import {spawn} from "child_process"

async function build_example(path: string): Promise<string | null> {
  const env = {
    ...process.env,
    BOKEH_DEV: "true",
    BOKEH_RESOURCES: "server",
    BOKEH_DEFAULT_SERVER_HOST: host,
    BOKEH_DEFAULT_SERVER_PORT: `${port}`,
  }

  console.log(`Building ${path}`)
  const proc = spawn("python", [path], {stdio: "pipe", env})

  let output = ""
  proc.stdout.on("data", (data) => {
    output += `${data}`
  })
  proc.stderr.on("data", (data) => {
    output += `${data}`
  })

  return new Promise((resolve, reject) => {
    proc.on("error", reject)
    proc.on("exit", (code) => {
      if (code === 0) {
        resolve(null)
      } else {
        const html = `\
<html>
<body style="white-space: pre; font-family: monospace;">
${output}
</body>
</html>
        `
        resolve(html)
      }
    })
  })
}

async function get_bokeh_example(path: string): Promise<string | null> {
  if (path.includes(".")) {
    return null
  }

  const py_path = resolve(join("../examples", `${path}.py`))
  if (!(fs.existsSync(py_path) && fs.statSync(py_path).isFile())) {
    return null
  }

  const error = await build_example(py_path)
  if (error != null) {
    return error
  }

  const html_path = join("../examples", `${path}.html`)
  if (!(fs.existsSync(html_path) && fs.statSync(html_path).isFile())) {
    return null
  }

  const html = await fs.promises.readFile(html_path, {encoding: "utf-8"})
  return html
}

app.get("/bokeh/examples/:path(*)", async (req, res) => {
  const {path} = req.params
  const example = await get_bokeh_example(path)
  if (example != null) {
    try {
      res.send(example)
      return
    } catch {}
  }

  res.status(404).send("No such example")
})

process.once("SIGTERM", () => {
  process.exit(0)
})

const host = argv.host as string | undefined ?? "127.0.0.1"
const port = parseInt(argv.port as string | undefined ?? "5777")

const server = app.listen(port, host)

server.on("listening", () => {
  console.log(`listening on ${host}:${port}`)
  process.send?.("ready")
})
server.on("error", (error) => {
  console.log(`unable to listen on ${host}:${port}\n  ${error}`)
  process.exit(1)
})
