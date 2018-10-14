Classless for Hexo
==================

This Hugo theme features the basic [Classless](https://classless.alhur.es/) templates for your posts and list of posts. One of the [themes supported on Classless](https://classless.alhur.es/themes) may be chosen from your site's `config.toml`, along with the hash of the commit which you want to reference. That is needed because the provider, https://rawgit.com/, needs that to serve cached, cdnized versions of the themes hosted on https://github.com/fiatjaf/classless/tree/master/themes/.

![](screenshot.png)

Parameters from your `_config.yml` used in this theme:

```yaml
url:
root:
permalink:

source_dir:
public_dir:
tag_dir:
archive_dir:

index_generator:
  path: ''
  per_page: 10
  order_by: -date

per_page:
pagination_dir:

theme: classless
title: # your site must have a title.
description: # you site must have a description.

theme_config:
  theme: # the theme name, taken from https://classless.alhur.es/themes/.
  commit_sha: # the last commit sha from https://github.com/fiatjaf/classless/,
              # used to generate the rawgit.com URL.
  theme_url: # alternatively, a full URL to the CSS that specifies the classless theme.
  nav: # an array of objects with .label and .url:
    - label: Home
      url: /
    - label: Archives
      url: /archives/
  date_format: 'MMMM Do YYYY'
  show_excerpts: true
  read_more: 'Read more...'
  

# all other settings are not explicitly used by the classless theme (but many are still
# useful to have in your configs, as they are used by Hexo itself).
#
# if you don't set a .theme and .commit_sha (or .theme_url), a random Classless theme
# will be included for you, and a poorly designed widget will appear on your site from
# which you'll be able to select themes and experiment with them before choosing one to
# write to your config file.
```

To set the content on the `body > aside` and on the `body > footer` elements, create a `source/aside.(html|md)` and a `source/footer.(html|md)`, set a `title: 'aside'` and `title: 'footer'` to them and write what you want to them. If you don't do this your site will have some stupid default texts on these important elements.
