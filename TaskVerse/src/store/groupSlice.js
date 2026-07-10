import { createSlice } from "@reduxjs/toolkit";
import db from "../../data/taskverse-db-turkce-isimli.json";

const groupSlice = createSlice({
  name: "groups",
  initialState: {
    groups: db.groups,
  },
  reducers: {
    setGroups: (state, action) => {
      state.groups = action.payload;
    },
  },
});

export const { setGroups } = groupSlice.actions;

export const selectAllGroups = (state) => state.groups.groups;

export default groupSlice.reducer;
