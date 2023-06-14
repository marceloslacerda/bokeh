#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING, Any, TypeVar

if TYPE_CHECKING:
    # External imports
    from typing_extensions import TypeAlias

# Bokeh imports
from ...util.strings import nice_join
from ._sphinx import property_link, register_type_link, type_link
from .bases import (
    Init,
    Property,
    SingleParameterizedProperty,
    TypeOrInst,
)
from .singletons import Intrinsic

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Where",
)

T = TypeVar("T")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

if TYPE_CHECKING:
    AnyProp: TypeAlias = TypeOrInst[Property[Any]]

class Where(SingleParameterizedProperty[T]):
    """

    """

    def __init__(
        self,
        type_param: TypeOrInst[Property[T]],
        name: str,
        types: AnyProp | tuple[AnyProp, ...],
        *,
        default: Init[T] = Intrinsic,
        help: str | None = None,
    ) -> None:
        super().__init__(type_param, default=default, help=help)
        self._query_name = name
        types = types if isinstance(types, tuple) else (types,)
        assert len(types) != 0, "required at least one type"
        self._query_types = tuple(self._validate_type_param(tp) for tp in types)

    def __call__(self, *, default: Init[T] = Intrinsic, help: str | None = None) -> Where[T]:
        """ Clone this property and allow to override ``default`` and ``help``. """
        default = self._default if default is Intrinsic else default
        help = self._help if help is None else help
        prop = self.__class__(self.type_param, self._query_name, self._query_types, default=default, help=help)
        prop.alternatives = list(self.alternatives)
        prop.assertions = list(self.assertions)
        return prop

    def __str__(self) -> str:
        class_name = self.__class__.__name__
        item_types = ", ".join(str(x) for x in self.type_params)
        query_types = ", ".join(str(x) for x in self._query_types)
        return f"{class_name}({item_types}, {self._query_name!r}, {query_types})"

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        name = self._query_name
        types = self._query_types

        try:
            attr = getattr(value, name)
        except AttributeError:
            raise ValueError(f"expected {value!r} to have an attribute '{name}'" if detail else "")

        for tp in types:
            if tp.is_valid(attr):
                return

        if len(types) == 1:
            (tp,) = types
            raise ValueError(f"expected {value!r} to have an attribute {name!r} of type {tp}" if detail else "")
        else:
            tps = nice_join([str(tp) for tp in types])
            raise ValueError(f"expected {value!r} to have an attribute {name!r} of type either {tps}" if detail else "")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

@register_type_link(Where)
def _sphinx_type_link(obj: SingleParameterizedProperty[Any]) -> str:
    return f"{property_link(obj)}({type_link(obj.type_param)})"
