import axiosClient from "./axiosClient";

const wikiAdminApi = {
  // CATEGORY
  getCategories: () => axiosClient.get("/wiki/admin/categories"),
  createCategory: (data) => axiosClient.post("/wiki/admin/categories", data),
  deleteCategory: (id) => axiosClient.delete(`/wiki/admin/categories/${id}`),

  // UNIT
  getUnits: () => axiosClient.get("/wiki/admin/units"),
  createUnit: (data) => axiosClient.post("/wiki/admin/units", data),
  deleteUnit: (id) => axiosClient.delete(`/wiki/admin/units/${id}`),

  // COUNTRY
  getCountries: () => axiosClient.get("/wiki/countries"),
  createCountry: (data) => axiosClient.post("/wiki/admin/countries", data),
  deleteCountry: (id) => axiosClient.delete(`/wiki/admin/countries/${id}`),

  // CITY
  getCities: (countryId) =>
    axiosClient.get("/wiki/cities", {
      params: countryId ? { countryId } : {},
    }),
  createCity: (data) => axiosClient.post("/wiki/admin/cities", data),
  deleteCity: (id) => axiosClient.delete(`/wiki/admin/cities/${id}`),

  // PRICE
  createPrice: (data) => axiosClient.post("/wiki/admin/prices", data),
  deletePrice: (id) => axiosClient.delete(`/wiki/admin/prices/${id}`),

  // CURRENCIES (public)
  getCurrencies: () => axiosClient.get("/wiki/currencies"),

  // PRICES (public)
  getPrices: (city, currency = "VND") =>
    axiosClient.get("/wiki/prices", { params: { city, currency } }),
};

export default wikiAdminApi;