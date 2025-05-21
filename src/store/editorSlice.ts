
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface EditorState {
  image: {
    url: string | null;
    file: File | null;
    loaded: boolean;
  };
  transformations: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
}

const initialState: EditorState = {
  image: {
    url: null,
    file: null,
    loaded: false,
  },
  transformations: {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  },
};

export const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setImage: (state, action: PayloadAction<{ file: File; url: string }>) => {
      state.image.file = action.payload.file;
      state.image.url = action.payload.url;
      state.image.loaded = true;
    },
    resetImage: (state) => {
      state.image = initialState.image;
      state.transformations = initialState.transformations;
    },
    setScale: (state, action: PayloadAction<number>) => {
      state.transformations.scale = action.payload;
    },
    setOffset: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.transformations.offsetX = action.payload.x;
      state.transformations.offsetY = action.payload.y;
    },
    resetTransformations: (state) => {
      state.transformations = initialState.transformations;
    },
  },
});

export const { setImage, resetImage, setScale, setOffset, resetTransformations } = editorSlice.actions;

export default editorSlice.reducer;
