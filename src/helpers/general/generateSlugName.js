import urlSlug from "url-slug";

export const generateSlugName = async (slugName, regenarate = false) => {
  if (regenarate === true) {
    const regex = /\d+/g;
    const matches = slugName.match(regex) ? slugName.match(regex) : "";
    const matc = matches && matches[0] ? Number(matches[0]) : 0;
    return slugName + (matc + 1);
  } else {
    return slugName ? urlSlug(slugName) : "";
  }
};
