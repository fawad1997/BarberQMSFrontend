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
        route: "Business",
        path: "/shop/business",
        icon: "bi bi-shop",
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
  }  if (role === "BARBER") {
    return [
      { route: "Dashboard", path: "/barber/dashboard", icon: "fa-solid fa-chart-line" },
      { route: "Appointments", path: "/barber/appointments", icon: "fa-solid fa-calendar-check" },
      { route: "Schedule", path: "/barber/schedule", icon: "fa-solid fa-clock" },
      { route: "Queue", path: "/barber/queue", icon: "fa-solid fa-users" }
    ];
  }
  return navLinks;
};
