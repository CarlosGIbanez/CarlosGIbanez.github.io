import type { SocialLink } from "../types";

export const SOCIALS: SocialLink[] = [
    {
        name: "Github",
        href: "https://github.com/CarlosGIbanez",
        linkTitle: `Carlos Gorostiza on GitHub`,
        isActive: true,
    },
    {
        name: "Mail",
        href: "mailto:CarlosGIbanez@proton.me",
        linkTitle: `Email Carlos`,
        isActive: false,
    },
    {
        name: "Google Scholar",
        href: "https://scholar.google.com/",
        linkTitle: `Carlos Gorostiza on Google Scholar`,
        isActive: false,
    },
    {
        name: "ORCID",
        href: "https://orcid.org/",
        linkTitle: `Carlos Gorostiza on ORCID`,
        isActive: false,
    },
    {
        name: "LinkedIn",
        href: "https://www.linkedin.com/in/carlos-gorostiza-ibáñez-68a09b2a8",
        linkTitle: `Carlos Gorostiza on LinkedIn`,
        isActive: true,
    },
];

export const SOCIAL_ICONS: Record<string, string> = {
    Github: "Github",
    Mail: "Mail",
    Linkedin: "LinkedIn",
    "Google Scholar": "GoogleScholar",
    ORCID: "ORCID",
    RSS: "RSS",
};