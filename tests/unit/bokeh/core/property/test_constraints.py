#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from bokeh.core.has_props import HasProps, Local
from bokeh.core.properties import Instance
from tests.support.util.api import verify_all

# Module under test
import bokeh.core.property.constraints as bcpc # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    "Where",
)

class Child0(HasProps, Local):
    pass
class Child1(Child0, Local):
    pass

class Parent(HasProps, Local):
    p0 = Instance(Child0)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Nullable:

    def test_is_valid(self) -> None:
        prop = bcpc.Where(Instance(Parent), "p0", Instance(Child1))
        assert prop.is_valid(Parent(p0=Child1())) is True
        assert prop.is_valid(Parent(p0=Child0())) is False

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpc, ALL)
