export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Local login redirect - no OAuth
export const startLogin = () => {
  window.location.href = "/login";
};
