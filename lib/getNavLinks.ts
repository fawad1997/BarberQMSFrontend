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
        dropdown: true,
        items: [
          {
            route: "Manage Shops",
            path: "/shop/shops",
            icon: "bi bi-shop",
          },
          {
            route: "Artists",
            path: "/shop/barbers",
            icon: "fas fa-cut",
          },
          {
            route: "Shop Services",
            path: "/shop/services",
            icon: "fas fa-scissors",
          }
        ]
      },
      {
        route: "Queue",
        path: "/shop/queue",
        icon: "bi bi-people-fill",
        dropdown: true,
        items: [
          {
            route: "Queue Dashboard",
            path: "/shop/queue",
            icon: "bi bi-list-ul",
          },
          {
            route: "Walk-Ins (Screen)",
            path: "/shop/walkins",
            icon: "bi bi-person-walking",
          }
        ]
      },
    ];
  }
  return navLinks;
};
