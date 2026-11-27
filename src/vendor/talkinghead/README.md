# TalkingHead (vendored)

[TalkingHead](https://github.com/met4citizen/TalkingHead) 1.8.2 by Mika
Suominen, MIT licensed (see `LICENSE`), copied unmodified from the npm package
`@met4citizen/talkinghead`. It animates the 3D avatar on `#/me`: lip-sync,
expressions, gestures and idle movement.

It's vendored rather than installed because the package pins three ^0.186
while the site runs 0.184, and two copies of three would double the bundle.
Only the English lip-sync module is kept; `src/components/TwinFace.jsx` loads
it itself, since the class's own loader uses a runtime `import(path)` that
the bundler can't follow.
