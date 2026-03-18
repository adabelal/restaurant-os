import { expect, test, describe } from "bun:test";
import { getApplicableRate } from "./rh-utils";

describe("getApplicableRate", () => {
    const fallbackRate = 12.02;
    const targetMonth = 0; // January
    const targetYear = 2024;

    describe("Error paths and edge cases for input", () => {
        test("should return fallbackRate when historyJson is null", () => {
            expect(getApplicableRate(null, fallbackRate, targetMonth, targetYear)).toBe(fallbackRate);
        });

        test("should return fallbackRate when historyJson is undefined", () => {
            expect(getApplicableRate(undefined, fallbackRate, targetMonth, targetYear)).toBe(fallbackRate);
        });

        test("should return fallbackRate when historyJson is empty string", () => {
            expect(getApplicableRate("", fallbackRate, targetMonth, targetYear)).toBe(fallbackRate);
        });

        test("should return fallbackRate when JSON.parse fails", () => {
            const invalidJson = "{ invalid json }";
            // Note: This will log an error to console, which is expected behavior in the code
            expect(getApplicableRate(invalidJson, fallbackRate, targetMonth, targetYear)).toBe(fallbackRate);
        });

        test("should return fallbackRate when history is not an array", () => {
            const notAnArray = '{"rate": 15, "startDate": "2024-01-01"}';
            expect(getApplicableRate(notAnArray, fallbackRate, targetMonth, targetYear)).toBe(fallbackRate);
        });

        test("should return fallbackRate when history array is empty", () => {
            const emptyArray = "[]";
            expect(getApplicableRate(emptyArray, fallbackRate, targetMonth, targetYear)).toBe(fallbackRate);
        });
    });

    describe("Date logic and rate selection", () => {
        const history = JSON.stringify([
            { rate: 10.0, startDate: "2023-01-01" },
            { rate: 11.0, startDate: "2023-06-01" },
            { rate: 12.0, startDate: "2024-01-01" }
        ]);

        test("should return applicable rate when target date matches start date exactly", () => {
            expect(getApplicableRate(history, fallbackRate, 0, 2024)).toBe(12.0);
            expect(getApplicableRate(history, fallbackRate, 5, 2023)).toBe(11.0);
        });

        test("should return most recent rate before target date", () => {
            // Feb 2024 should still be 12.0
            expect(getApplicableRate(history, fallbackRate, 1, 2024)).toBe(12.0);
            // July 2023 should be 11.0
            expect(getApplicableRate(history, fallbackRate, 6, 2023)).toBe(11.0);
        });

        test("should return fallbackRate when target date is before any entry in history", () => {
            expect(getApplicableRate(history, fallbackRate, 0, 2022)).toBe(fallbackRate);
        });

        test("should handle unsorted history correctly (code sorts it)", () => {
            const unsortedHistory = JSON.stringify([
                { rate: 12.0, startDate: "2024-01-01" },
                { rate: 10.0, startDate: "2023-01-01" },
                { rate: 11.0, startDate: "2023-06-01" }
            ]);
            expect(getApplicableRate(unsortedHistory, fallbackRate, 5, 2023)).toBe(11.0);
        });

        test("should work for the very first entry in history", () => {
            expect(getApplicableRate(history, fallbackRate, 0, 2023)).toBe(10.0);
        });

        test("should handle target date later than all entries", () => {
            expect(getApplicableRate(history, fallbackRate, 0, 2025)).toBe(12.0);
        });

        test("should handle multiple entries in the same year", () => {
            expect(getApplicableRate(history, fallbackRate, 5, 2023)).toBe(11.0); // June 2023
            expect(getApplicableRate(history, fallbackRate, 4, 2023)).toBe(10.0); // May 2023
        });
    });
});
