// implementiert von Codex

const { performance } = require("node:perf_hooks");
const createSortModule = require("./sortieralgorithmen.js");

const ARRAY_COUNT = 100;
const ARRAY_SIZE = 6000;

// JavaScript-Entsprechungen der C++-Algorithmen.
function insertionSort(array) {
    for (let i = 1; i < array.length; i++) {
        const value = array[i];
        let j = i;

        while (j > 0 && value < array[j - 1]) {
            array[j] = array[j - 1];
            j--;
        }

        array[j] = value;
    }

    return array;
}

function recursiveInsertionSort(array, start = 1) {
    if (start >= array.length) {
        return array;
    }

    const value = array[start];
    let j = start;

    while (j > 0 && value < array[j - 1]) {
        array[j] = array[j - 1];
        j--;
    }

    array[j] = value;
    return recursiveInsertionSort(array, start + 1);
}

function selectionSort(array) {
    for (let i = 0; i < array.length - 1; i++) {
        let minimum = i;

        for (let j = i + 1; j < array.length; j++) {
            if (array[j] < array[minimum]) {
                minimum = j;
            }
        }

        if (minimum !== i) {
            [array[i], array[minimum]] = [array[minimum], array[i]];
        }
    }

    return array;
}

function createTestArrays() {
    // Ein einfacher deterministischer Zufallszahlengenerator sorgt dafür,
    // dass WASM und JavaScript exakt dieselben Eingaben bekommen.
    let seed = 0x12345678;

    function nextNumber() {
        seed = (1664525 * seed + 1013904223) >>> 0;
        return seed % 100000;
    }

    return Array.from({ length: ARRAY_COUNT }, () =>
        Array.from({ length: ARRAY_SIZE }, nextNumber)
    );
}

function getHeap32(Module) {
    if (Module.HEAP32) {
        return Module.HEAP32;
    }

    if (Module.wasmMemory) {
        return new Int32Array(Module.wasmMemory.buffer);
    }

    throw new Error("Kein WebAssembly-Speicher gefunden.");
}

function sortWithWasm(array, sortFunction, Module, recursive = false) {
    const pointer = Module._malloc(array.length * Int32Array.BYTES_PER_ELEMENT);

    if (!pointer) {
        throw new Error("WebAssembly-Speicher konnte nicht reserviert werden.");
    }

    try {
        getHeap32(Module).set(array, pointer / Int32Array.BYTES_PER_ELEMENT);

        if (recursive) {
            sortFunction(pointer, array.length, 1, false);
        } else {
            sortFunction(pointer, array.length, false);
        }

        const heap = getHeap32(Module);
        return Array.from(
            heap.subarray(
                pointer / Int32Array.BYTES_PER_ELEMENT,
                pointer / Int32Array.BYTES_PER_ELEMENT + array.length
            )
        );
    } finally {
        Module._free(pointer);
    }
}

function assertSorted(array, algorithmName, implementationName) {
    for (let i = 1; i < array.length; i++) {
        if (array[i - 1] > array[i]) {
            throw new Error(
                `${implementationName} ${algorithmName} hat das Array nicht sortiert.`
            );
        }
    }
}

function measure(label, arrays, sort) {
    const start = performance.now();

    for (const input of arrays) {
        const result = sort(input);
        assertSorted(result, label, sort.implementationName);
    }

    const totalMilliseconds = performance.now() - start;
    return {
        Algorithmus: label,
        Implementierung: sort.implementationName,
        Durchläufe: arrays.length,
        "Zahlen pro Array": arrays[0].length,
        "Gesamt (ms)": Number(totalMilliseconds.toFixed(3)),
        "Durchschnitt (ms)": Number((totalMilliseconds / arrays.length).toFixed(3)),
    };
}

async function main() {
    const Module = await createSortModule();
    const testArrays = createTestArrays();

    const algorithms = [
        {
            name: "Insertion Sort",
            javascript: insertionSort,
            wasm: (array) => sortWithWasm(array, Module._insertionSort, Module),
        },
        {
            name: "Recursive Insertion Sort",
            javascript: recursiveInsertionSort,
            wasm: (array) =>
                sortWithWasm(array, Module._recursiveInsertionSort, Module, true),
        },
        {
            name: "Selection Sort",
            javascript: selectionSort,
            wasm: (array) => sortWithWasm(array, Module._SelectionSort, Module),
        },
    ];

    const results = [];

    for (const algorithm of algorithms) {
        const javascriptSort = (array) => algorithm.javascript([...array]);
        javascriptSort.implementationName = "JavaScript";
        results.push(measure(algorithm.name, testArrays, javascriptSort));

        const wasmSort = (array) => algorithm.wasm(array);
        wasmSort.implementationName = "WebAssembly";
        results.push(measure(algorithm.name, testArrays, wasmSort));
    }

    console.log(
        `Benchmark: ${ARRAY_COUNT} Arrays mit jeweils ${ARRAY_SIZE} Zahlen`
    );
    console.table(results);
}

main().catch((error) => {
    console.error("Benchmark fehlgeschlagen:", error);
    process.exitCode = 1;
});

