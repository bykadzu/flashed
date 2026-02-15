## Summary

The nanoid package was already a dependency but wasn't being used for ID generation in the HTML library. This fix:

- Uses `nanoid()` for generating cryptographically secure, collision-resistant IDs
- Replaces the weak `Math.random()` + timestamp approach

## Why

`Math.random()` based IDs can collide and are not suitable for unique identifiers. nanoid is already installed as a dependency but wasn't being utilized.
