# Contributing to Browser Lab

Welcome to **HunLuanZhiZhu Browser Lab**, a personally curated space for creative technology, interactive experiences, and browser experiments.

Contributions are welcome in three areas: the community showcase, homepage improvements, and translations. **English and Chinese** submissions are welcome.

## 1. Community showcase

We welcome any creative project visitors can experience directly in their browsers: interactive art, games, scientific and AI visualizations, educational demos, tools, and other web experiments. Submissions are not limited to AI or programming topics.

**Requirements**

- A publicly accessible live demo is required (HTTPS for featured links).
- Creators host and maintain their own projects; Browser Lab links to them but does not host their code.
- Submitters must have the right to share the project information.
- No plagiarism, malicious software, spam, or infringing content.
- The core experience should generally work without payment or registration.

**How to submit**

[Open a community showcase issue](https://github.com/HunLuanZhiZhu/hunluanzhizhu.github.io/issues/new?template=community-showcase.yml) and provide:

1. **Project name** (required)
2. **Creator name or handle** (required)
3. **Short description** (required)
4. **Live demo URL** (required)
5. **Source repository URL** (optional)
6. **Suggested category** (optional)

**Please do not upload preview images.** To keep the homepage fast and consistent, Browser Lab uses its own lightweight procedural Canvas graphics, not submitted screenshots or remote images. These visuals are decorative and may not depict the submitted project.

Approved projects may be listed in the [Community showcase](https://zyh.sryze.cc/#community), linking to their original sites, with creator attribution.

The maintainer controls the curated `community.json` file, which follows this format:

```json
{
  "schema_version": 1,
  "projects": [
    {
      "title": "Example project",
      "creator": "Example creator",
      "description": "An interactive browser experiment.",
      "url": "https://example.org/demo",
      "repository": "https://github.com/example/project",
      "category": "Creative coding"
    }
  ]
}
```

The `repository` and `category` fields are optional. All links use HTTPS. The homepage shows up to 12 manually selected entries; **do not directly add unreviewed submissions to `community.json`**.

## 2. Homepage improvements

Pull requests improving homepage visuals, interactions, responsive layout, performance, and accessibility are welcome.

Keep the static HTML/CSS/JavaScript architecture. Avoid unnecessary build tools, third-party fonts, remote images, large dependencies, or heavy animation workloads. Explain your changes and what you tested; include before/after comparisons when helpful.

## 3. Translations

Translations and corrections for existing subprojects are welcome. Preserve technical accuracy, identify the original version, and maintain the original behavior and layout where practical.

Different projects have different requirements; multilingual coverage and continuous translation updates are not guaranteed.

## 4. Review and maintenance

Browser Lab is personally maintained; it is **not** a public project hosting platform.

- All changes and showcase submissions require maintainer approval.
- The maintainer may accept, reject, reorder, or remove showcased projects, with no guaranteed response time.
- Featuring a project does not guarantee its security, quality, or continued availability.
- Creators remain responsible for the hosting and maintenance of their own work.
- Community projects are not hosted under this site's `projects/` directory unless separately agreed.

**Our goal is not to collect the most projects, but to help interesting browser creations be discovered.**
