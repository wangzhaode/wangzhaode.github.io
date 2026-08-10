---
layout: default
permalink: /
title: Blog
browser_title: zhaode · bits & days
nav: true
pagination:
  enabled: true
  per_page: 25
  permalink: /page/:num/
  sort_reverse: true
description: "Technical notes on inference engines, on-device AI, systems, and life."
---

<section class="container-posts" aria-label="Blog posts">
  {% if paginator and paginator.posts %}
    {% assign postlist = paginator.posts %}
  {% else %}
    {% assign postlist = site.posts %}
  {% endif %}

{% for post in postlist %}

<article class="posts-list-item">
<a class="posts-list-item-name ref_internal" href="{{ post.url | relative_url }}">{{ post.title }}</a>
<time class="posts-list-item-date" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%Y-%m-%d' }}</time>
</article>
{% endfor %}

{% if paginator and paginator.total_pages > 1 %}

<nav class="list-pagination" aria-label="Blog pagination">
<span>
{% if paginator.previous_page %}
<a class="ref_internal" href="{{ paginator.previous_page_path | relative_url }}">Previous</a>
{% endif %}
</span>
<span>Page {{ paginator.page }} / {{ paginator.total_pages }}</span>
<span>
{% if paginator.next_page %}
<a class="ref_internal" href="{{ paginator.next_page_path | relative_url }}">Next</a>
{% endif %}
</span>
</nav>
{% endif %}

</section>
