export const navLinks = [
  {
    route: "Home",
    path: "/",
    icon: "fa-solid fa-home"
  },
  {
    route: "Features",
    path: "#features",
    icon: "fa-solid fa-star"
  },
  {
    route: "Salons",
    path: "/salons",
    icon: "fa-solid fa-scissors"
  },
  {
    route: "Feedback",
    path: "/contact",
    icon: "fa-solid fa-comments"
  }
]

export const footerLinks = [
  {
    route: "Privacy Policy",
    path: "/legal/privacy-policy"
  },
  {
    route: "Terms of Service",
    path: "/legal/terms-of-service"
  },
  {
    route: "Data Deletion",
    path: "/legal/data-deletion"
  },
  {
    route: "Legal",
    path: "/legal"
  }
]

export const barberFooterLinks = [
  {
    route: "Dashboard",
    path: "/barber/dashboard"
  },
  {
    route: "Appointments",
    path: "/barber/appointments"
  },
  {
    route: "Schedule",
    path: "/barber/schedule"
  },
  {
    route: "Support",
    path: "/contact"
  },
  ...footerLinks
]
