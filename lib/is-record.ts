const isRecordOfStringArrays = (
  value: unknown
): value is Record<string, string[]> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (v) => Array.isArray(v) && v.every((item) => typeof item === "string")
    )
  );
};

export default isRecordOfStringArrays;
