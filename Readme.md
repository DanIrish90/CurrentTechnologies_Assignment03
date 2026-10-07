# Vergleich von Sortieralgorithmen

MCI Daniel Riml

sortieralgorithmen.cpp wurde im 2.Semester in Algorithmen und Datenstrukturen in Assignment4 erstellt.
Die Datei wurde erweitert um mit emscripten die wasm und js datei bereitzustellen.

Kompilierung von sortieralgorithmen.cpp mit dem Befehl

```
em++ src/sortieralgorithmen.cpp    \
    -O3   -s MODULARIZE=1 \
    -s EXPORT_NAME=createSortModule \
    -s EXPORTED_FUNCTIONS='["_insertionSort","_recursiveInsertionSort","_SelectionSort","_malloc","_free"]' \
    -s EXPORTED_RUNTIME_METHODS='["HEAP32"]'   -o sortieralgorithmen.js
``` 

# Vergleich in Javascript

mithilfe von
```bash
node benchmark.js
``` 
den Vergleich zwischen Nativer Javascript und cpp Implementierung starten.
