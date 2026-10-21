import { validatePlaylistName } from "./playlistCreate";

describe("playlistCreate", () => {
test("accepts a valid playlist name", () => {
expect(validatePlaylistName("validName")).toBe(true);
});

test("rejects an empty playlist name", () => {
expect(validatePlaylistName("")).toBe(false);
});

test("rejects a duplicate playlist name", () => {
const duplicateName = "MyPlaylist";
const existingNames = ["MyPlaylist", "OtherPlaylist"];

expect(
  validatePlaylistName(duplicateName, existingNames)
).toBe(false);

});

test("rejects a playlist name exceeding the maximum length", () => {
const longName = "a".repeat(150);

expect(validatePlaylistName(longName)).toBe(false);

});
});