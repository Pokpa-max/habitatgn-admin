export const handleImageFile = (files, setImagePreview) => {
  const reader = new FileReader();
  const file = files[0];

  if (!file) return;

  reader.onloadend = () => {
    setImagePreview(reader.result);
  };

  reader.readAsDataURL(file);
};



