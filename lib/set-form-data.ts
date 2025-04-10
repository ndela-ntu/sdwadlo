const setOrAppendFormData = (
  formData: FormData,
  { key, value }: { key: string; value: string | File }
) => {
  if (formData.has(key)) {
    formData.set(key, value);
  } else {
    formData.append(key, value);
  }
};

export default setOrAppendFormData;
