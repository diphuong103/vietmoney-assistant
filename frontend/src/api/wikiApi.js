import axiosClient from "./axiosClient";

const wikiApi = {

  getPrices: (city, currency = "VND") =>
    axiosClient.get("/wiki/prices", { params: { city, currency } }),

  getCategories: () =>
    axiosClient.get("/wiki/categories"),

  getCountries: () =>
    axiosClient.get("/wiki/countries"),

  getCities: (countryId) =>
    axiosClient.get("/wiki/cities", {
      params: countryId ? { countryId } : {}
    }),

  getCurrencies: () =>
    axiosClient.get("/wiki/currencies"),
};

export default wikiApi;