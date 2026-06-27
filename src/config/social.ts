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
        href: "mailto:",
        linkTitle: `Email Carlos`,
        isActive: false,
    },
    {
        name: "Google Scholar",
        href: "https://scholar.google.com/citations?user=QnOgg5cAAAAJ",
        linkTitle: `Carlos Gorostiza on Google Scholar`,
        isActive: true,
    },
    {
        name: "ORCID",
        href: "https://orcid.org/0009-0008-0370-7518",
        linkTitle: `Carlos Gorostiza on ORCID`,
        isActive: true,
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