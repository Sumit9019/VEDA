const removeTrailingSlash = (value: string) => value.replace(/\/$/, "");

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const socketBase = process.env.NEXT_PUBLIC_SOCKET_URL ?? apiBase;

export const config = {
  apiBaseUrl: removeTrailingSlash(apiBase),
  socketUrl: removeTrailingSlash(socketBase),
  brand: {
    name: "VedaAI",
    shortName: "V",
  },
  currentUser: {
    name: process.env.NEXT_PUBLIC_USER_NAME ?? "John Doe",
  },
  school: {
    name: process.env.NEXT_PUBLIC_SCHOOL_NAME ?? "Delhi Public School",
    location: process.env.NEXT_PUBLIC_SCHOOL_LOCATION ?? "Bokaro Steel City",
  },
  paper: {
    schoolHeading: process.env.NEXT_PUBLIC_PAPER_SCHOOL_HEADING ?? "Delhi Public School, Sector-4, Bokaro",
  },
  defaultAssignment: {
    subject: process.env.NEXT_PUBLIC_DEFAULT_SUBJECT ?? "Science",
    className: process.env.NEXT_PUBLIC_DEFAULT_CLASS ?? "Class 5",
  },
};

export const getApiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${config.apiBaseUrl}${normalizedPath}`;
};
