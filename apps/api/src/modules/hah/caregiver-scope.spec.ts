import {
  caregiverScopeList,
  requiredCaregiverScope,
} from "./caregiver-scope";

describe("caregiver scopes", () => {
  it("memetakan resource klinis ke scope consent", () => {
    expect(
      requiredCaregiverScope("hah/episodes/:id/medication-adherence"),
    ).toBe("MEDICATIONS");
    expect(requiredCaregiverScope("hah/episodes/:id/messages")).toBe(
      "MESSAGES",
    );
    expect(requiredCaregiverScope("hah/episodes/:id/tasks")).toBe("CARE_PLAN");
    expect(requiredCaregiverScope("hah/episodes/:id")).toBe("SUMMARY");
    expect(requiredCaregiverScope("hah/episodes/:id/emergency-events")).toBe(
      null,
    );
  });

  it("mengabaikan scope yang tidak dikenal", () => {
    expect(
      caregiverScopeList(["SUMMARY", "VITALS", "UNSAFE_INTERNAL_SCOPE"]),
    ).toEqual(["SUMMARY", "VITALS"]);
  });
});