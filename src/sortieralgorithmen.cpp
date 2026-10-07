//
// Created by Daniel on 19.06.2025.
//

#include <emscripten/emscripten.h>

extern "C" {

EMSCRIPTEN_KEEPALIVE
void insertionSort(int Array[], int ArraySize, bool Debug) {
    for (int i = 1; i < ArraySize; i++) {
        int tmp = Array[i];
        int j;
        for (j = i; j >0 && tmp < Array[j - 1]; j--) {
            Array[j] = Array[j - 1];
        }
        Array[j] = tmp;
    }
}

EMSCRIPTEN_KEEPALIVE
void recursiveInsertionSort(int Array[], int ArraySize, int Start, bool Debug) {
    if (Start >= ArraySize) {
        return;
    }
    int tmp = Array[Start];
    int j;
    for (j = Start; j > 0 && tmp < Array[j - 1]; j--) {
        Array[j] = Array[j - 1];
    }
    Array[j] = tmp;

    recursiveInsertionSort(Array, ArraySize, Start + 1, Debug);
}

EMSCRIPTEN_KEEPALIVE
void SelectionSort(int Array[], int ArraySize, bool Debug) {
    for (int i = 0; i < ArraySize - 1; i++) {
        int min = i;
        for (int j = i + 1; j < ArraySize; j++) {
            if (Array[j] < Array[min]) {
                min = j;
            }
        }

        if (min != i) {
            int tmp = Array[i];
            Array[i] = Array[min];
            Array[min] = tmp;
        }
    }
}


}
