HEX
===

This is an implementation of [Hex](https://en.wikipedia.org/wiki/Hex_%28board_game%29)
in three.js. Hex is a strategy game invented in 1942 by Piet Hein, and independently
re-invented by John Nash in 1947.

This implementation supports [WebVR](http://mozvr.com) which requires a special
browser build and a Head Mounted Display e.g. Oculus Rift.

Rules
-----

Players take turns placing their color on the game board. The goal is to create
a connected path of their color between two sides of the board marked by their colors.

controls
--------

The current player is represented by the dodecahedron in the top right corner of
the game board. To select, Point at the hexagon you wish and click.

VR Specific Controls:
* `F` - Enter full screen mode
* `Z` - re-center VR controls
* `Enter` - select hexagon
