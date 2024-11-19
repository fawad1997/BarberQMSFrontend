import { navLinks } from "./links";

export const getNavLinks = (role?: string) => {
  if (role === "SHOP_OWNER") {
    return [
      {
        route: "Dashboard",
        path: "/shop/dashboard",
        icon: "bi bi-speedometer2",
      },
      {
        route: "Shops",
        path: "/shop/shops",
        icon: "bi bi-shop",
      },
    ];
  }
  return navLinks;
};
