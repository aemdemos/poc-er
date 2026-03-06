var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import.js
  var import_exports = {};
  __export(import_exports, {
    default: () => import_default
  });

  // tools/importer/block-parsers/cards-hero.js
  function parse(element, document) {
    const items = element.querySelectorAll(".jlr-house-of-brands-block__item");
    const cells = [["Cards (hero)"]];
    items.forEach((item) => {
      const img = item.querySelector(".jlr-house-of-brands-block__item__bg-picture img");
      const link = item.querySelector("a.jlr-button--type-primary:not(.jlr-house-of-brands-block__item__button-hidden)");
      if (img && link) {
        const image = document.createElement("img");
        image.src = img.src;
        let alt = "Discovery";
        if (link.href.includes("rangerover")) alt = "Range Rover";
        else if (link.href.includes("defender")) alt = "Defender";
        image.alt = alt;
        const body = document.createElement("div");
        const strong = document.createElement("strong");
        strong.textContent = image.alt;
        body.appendChild(strong);
        body.appendChild(document.createTextNode(" "));
        const cta = document.createElement("a");
        cta.href = link.href;
        cta.textContent = link.textContent.trim() || "Enter";
        body.appendChild(cta);
        cells.push([image, body]);
      }
    });
    return cells;
  }

  // tools/importer/parsers/metadata.js
  function createMetadataBlock(document) {
    const cells = [];
    const title = document.querySelector("title");
    if (title && title.textContent.trim()) {
      cells.push([["title"], [title.textContent.trim()]]);
    }
    const desc = document.querySelector('meta[name="description"]');
    if (desc && desc.getAttribute("content")) {
      cells.push([["description"], [desc.getAttribute("content")]]);
    }
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.getAttribute("content")) {
      cells.push([["og:image"], [ogImage.getAttribute("content")]]);
    }
    return WebImporter.Blocks.createBlock(document, { name: "Metadata", cells });
  }

  // tools/importer/page-transformers/homepage.js
  function transform(main, document, url) {
    const output = document.createElement("div");
    const hobBlock = main.querySelector(".jlr-house-of-brands-block");
    if (hobBlock) {
      const cells = parse(hobBlock, document);
      const blockCells = cells.slice(1);
      const block = WebImporter.Blocks.createBlock(document, {
        name: cells[0][0] || "Cards (hero)",
        cells: blockCells
      });
      output.appendChild(block);
      output.appendChild(document.createElement("hr"));
    }
    const metadataBlock = createMetadataBlock(document);
    if (metadataBlock) {
      output.appendChild(metadataBlock);
    }
    return output;
  }

  // tools/importer/parsers/hero.js
  function parse2(element, { document }) {
    const heroImage = element.querySelector(".jlr-immersive-hero__auto-column--big img") || element.querySelector(".jlr-immersive-hero img");
    const heading = element.querySelector(".jlr-immersive-hero__content__heading") || element.querySelector("h1");
    const subtitle = element.querySelector(".jlr-immersive-hero__content__paragraph");
    const ctaLinks = Array.from(
      element.querySelectorAll(".jlr-immersive-hero__content__buttons-holder a.jlr-button, .jlr-immersive-hero__content__buttons-holder a.jlr-immersive-hero__content__anchor-button")
    );
    const cells = [];
    if (heroImage) {
      cells.push([heroImage]);
    }
    if (heading) {
      const h1 = document.createElement("h1");
      h1.textContent = heading.textContent.trim();
      cells.push([h1]);
    }
    const contentCell = [];
    if (subtitle) {
      contentCell.push(subtitle.textContent.trim());
    }
    ctaLinks.forEach((link) => {
      const a = document.createElement("a");
      a.href = link.getAttribute("href");
      a.textContent = link.textContent.trim();
      contentCell.push(a);
    });
    const videoSource = element.querySelector(".jlr-immersive-hero__video video source[src]") || element.querySelector(".jlr-native-video-frame video source[src]") || element.querySelector("video source[src]");
    if (videoSource) {
      const videoLink = document.createElement("a");
      videoLink.href = videoSource.getAttribute("src");
      videoLink.textContent = "video";
      contentCell.push(videoLink);
    }
    if (contentCell.length > 0) {
      cells.push(contentCell);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/utils/icon-map.js
  var ICON_MAP = {
    "icon-ignite-configure": "configure",
    "icon-ignite-drive": "steering-wheel",
    "icon-phone": "steering-wheel",
    "icon-map-pin": "envelope",
    "icon-thumbnail_view": "calculator",
    "icon-request-quote-dollar": "envelope",
    "icon-envelope": "envelope",
    "icon-calculator": "calculator",
    "icon-bookmark": "envelope"
  };
  function getIconName(iconElement, index) {
    if (iconElement) {
      for (const [cssClass, edsName] of Object.entries(ICON_MAP)) {
        if (iconElement.classList.contains(cssClass)) return edsName;
      }
    }
    const positionalMap = ["configure", "steering-wheel", "calculator", "envelope"];
    return positionalMap[index] || "link";
  }

  // tools/importer/parsers/floating-quicklinks.js
  function parse3(element, { document }) {
    const cells = [];
    const items = Array.from(element.querySelectorAll(".ready-to-go-bar__item"));
    items.forEach((item, index) => {
      const href = item.getAttribute("href");
      const ctaText = item.querySelector(".jlr-cta__text span, .jlr-cta__text, .ready-to-go-bar__cta span");
      const linkText = ctaText ? ctaText.textContent.trim() : "";
      const iconEl = item.querySelector(".ready-to-go-bar__icon");
      const iconName = getIconName(iconEl, index);
      const iconCell = `:${iconName}:`;
      const link = document.createElement("a");
      link.href = href;
      link.textContent = linkText.toUpperCase();
      cells.push([iconCell, [link]]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Floating Quicklinks", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-image-carousel.js
  function parse4(element, { document }) {
    const cells = [];
    const slides = Array.from(
      element.querySelectorAll(".swiper-slide.jlr-slide")
    ).filter((slide) => !slide.classList.contains("swiper-slide-duplicate"));
    slides.forEach((slide) => {
      const img = slide.querySelector(".jlr-hero-carousel-slide-core__media-box img") || slide.querySelector(".jlr-hero-slider__bg-image") || slide.querySelector("img");
      const heading = slide.querySelector(".jlr-hero-slider-banner__copy h1") || slide.querySelector(".jlr-hero-slider-banner__copy h2") || slide.querySelector(".jlr-hero-slider-banner__copy h3") || slide.querySelector(".jlr-hero-slider-banner h1, .jlr-hero-slider-banner h2");
      const desc = slide.querySelector(".jlr-hero-slider-banner__copy .jlr-paragraph") || slide.querySelector('.jlr-hero-slider-banner__copy div[class*="paragraph"]');
      const imageCell = [];
      if (img) {
        const imgEl = document.createElement("img");
        imgEl.src = img.getAttribute("src");
        imgEl.alt = img.getAttribute("alt") || "";
        imageCell.push(imgEl);
      }
      const textCell = [];
      if (heading) {
        const h2 = document.createElement("h2");
        h2.textContent = heading.textContent.trim();
        textCell.push(h2);
      }
      if (desc) {
        textCell.push(desc.textContent.trim());
      }
      if (imageCell.length > 0 || textCell.length > 0) {
        cells.push([imageCell, textCell]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Hero Image Carousel", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/image-box.js
  function parse5(element, { document }) {
    const container = document.createElement("div");
    const img = element.querySelector(".jlr-image-box__background") || element.querySelector(".jlr-image-box img") || element.querySelector("img");
    if (img) {
      const imgEl = document.createElement("img");
      imgEl.src = img.getAttribute("src");
      imgEl.alt = img.getAttribute("alt") || "";
      container.appendChild(imgEl);
    }
    const quote = element.querySelector(".jlr-paragraph--size-quote") || element.querySelector(".jlr-image-box__content .jlr-paragraph");
    if (quote) {
      const p = document.createElement("p");
      const text = quote.textContent.trim();
      p.textContent = `"${text}"`;
      container.appendChild(p);
    }
    element.replaceWith(container);
  }

  // tools/importer/parsers/cards.js
  function parse6(element, { document }) {
    const cardItems = Array.from(
      element.querySelectorAll(".jlr-block-item.jlr-content-blocks__item")
    );
    if (cardItems.length === 0) {
      cardItems.push(...element.querySelectorAll(".jlr-block-item"));
    }
    const cells = [];
    cardItems.forEach((card) => {
      card.querySelectorAll("sub, sup, subscript, superscript").forEach((el) => el.remove());
      const img = card.querySelector(".jlr-block-item__image-wrapper img") || card.querySelector("img");
      const heading = card.querySelector(".jlr-block-item__heading") || card.querySelector("h2");
      const description = card.querySelector(".jlr-block-item__paragraph") || card.querySelector(".jlr-column-template__paragraph");
      const primaryCta = card.querySelector(".jlr-column-template__button");
      const secondaryCta = card.querySelector(".jlr-cta");
      const imageCell = [];
      if (img) {
        const imgEl = document.createElement("img");
        imgEl.src = img.getAttribute("src");
        imgEl.alt = img.getAttribute("alt") || "";
        imageCell.push(imgEl);
      }
      const textCell = [];
      if (heading) {
        const strong = document.createElement("strong");
        strong.textContent = heading.textContent.trim();
        textCell.push(strong);
      }
      if (description) {
        textCell.push(description.textContent.trim());
      }
      if (primaryCta) {
        const a = document.createElement("a");
        a.href = primaryCta.getAttribute("href");
        a.textContent = primaryCta.textContent.trim();
        textCell.push(a);
      }
      if (secondaryCta) {
        const a = document.createElement("a");
        a.href = secondaryCta.getAttribute("href");
        a.textContent = secondaryCta.textContent.trim();
        textCell.push(a);
      }
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel.js
  function parse7(element, { document }) {
    const cells = [];
    const dualFrameSlides = Array.from(element.querySelectorAll(".swiper-slide.jlr-slide"));
    if (dualFrameSlides.length > 0) {
      dualFrameSlides.forEach((slide) => {
        const img = slide.querySelector(".jlr-dual-frame-carousel__slider-img img") || slide.querySelector("img");
        const heading = slide.querySelector(".jlr-column-template__heading") || slide.querySelector("h1, h2, h3");
        const text = slide.querySelector(".jlr-column-template__paragraph");
        const cta = slide.querySelector(".jlr-column-template__button") || slide.querySelector("a.jlr-button");
        const imageCell = [];
        if (img) {
          const imgEl = document.createElement("img");
          imgEl.src = img.getAttribute("src");
          imgEl.alt = img.getAttribute("alt") || "";
          imageCell.push(imgEl);
        }
        const textCell = [];
        if (heading) {
          const h2 = document.createElement("h2");
          h2.textContent = heading.textContent.trim();
          textCell.push(h2);
        }
        if (text) {
          textCell.push(text.textContent.trim());
        }
        if (cta) {
          const a = document.createElement("a");
          a.href = cta.getAttribute("href");
          a.textContent = cta.textContent.trim();
          textCell.push(a);
        }
        cells.push([imageCell, textCell]);
      });
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Carousel", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function parse8(element, { document }) {
    const cells = [];
    const isMasonry = element.classList.contains("jlr-masonry-block") || element.querySelector(".jlr-masonry-block");
    const masonryRoot = element.classList.contains("jlr-masonry-block") ? element : element.querySelector(".jlr-masonry-block");
    if (masonryRoot) {
      const isReversed = !!masonryRoot.querySelector(".jlr-grid--columns-3-reversed");
      const copyBlock = masonryRoot.querySelector(".jlr-masonry-block__copy");
      const textCell = [];
      if (copyBlock) {
        const heading = copyBlock.querySelector(".jlr-column-template__heading") || copyBlock.querySelector("h2");
        if (heading) {
          const h2 = document.createElement("h2");
          h2.textContent = heading.textContent.trim();
          textCell.push(h2);
        }
        const desc = copyBlock.querySelector(".jlr-column-template__paragraph");
        if (desc) {
          textCell.push(desc.textContent.trim());
        }
        const buttons = Array.from(copyBlock.querySelectorAll("a.jlr-button"));
        const ctaLinks = Array.from(copyBlock.querySelectorAll("a.jlr-cta"));
        [...buttons, ...ctaLinks].forEach((link) => {
          const a = document.createElement("a");
          a.href = link.getAttribute("href");
          a.textContent = link.textContent.trim();
          textCell.push(a);
        });
      }
      const imageWrapper = masonryRoot.querySelector(".jlr-masonry-block__grid-wrapper");
      const imageCell = [];
      if (imageWrapper) {
        const images = Array.from(imageWrapper.querySelectorAll(".jlr-masonry-block__image"));
        images.forEach((img) => {
          const imgEl = document.createElement("img");
          imgEl.src = img.getAttribute("src");
          imgEl.alt = img.getAttribute("alt") || "";
          imageCell.push(imgEl);
        });
      }
      if (isReversed) {
        cells.push([imageCell, textCell]);
      } else {
        cells.push([textCell, imageCell]);
      }
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hotspots.js
  function extractHotspotData(element, document) {
    const img = element.querySelector(".jlr-hotspots-wrapper img") || element.querySelector(".jlr-hotspots-container__columns img") || element.querySelector("img");
    let imgEl = null;
    if (img) {
      imgEl = document.createElement("img");
      imgEl.src = img.getAttribute("src");
      imgEl.alt = img.getAttribute("alt") || "";
    }
    const items = Array.from(
      element.querySelectorAll(".jlr-hotspots-wrapper__item")
    );
    const positions = items.map((item) => {
      const style = item.getAttribute("style") || "";
      const topMatch = style.match(/top:\s*([\d.]+)%/);
      const leftMatch = style.match(/left:\s*([\d.]+)%/);
      return {
        top: topMatch ? topMatch[1] : "0",
        left: leftMatch ? leftMatch[1] : "0"
      };
    });
    let cards = [];
    const cardsJson = element.getAttribute("data-hotspot-cards");
    if (cardsJson) {
      try {
        cards = JSON.parse(cardsJson);
      } catch (e) {
      }
    }
    return { img: imgEl, positions, cards };
  }

  // tools/importer/parsers/electrifying-power.js
  function parse9(element, { document }) {
    const cells = [];
    const heading = element.querySelector(".jlr-column-template__heading") || element.querySelector(".jlr-electrifying-power__copy h2");
    const desc = element.querySelector(".jlr-column-template__paragraph");
    const specItems = Array.from(element.querySelectorAll(".jlr-electrifying-power__item"));
    const specs = specItems.map((item) => {
      const tagline = item.querySelector(".jlr-electrifying-power__item__tagline");
      const title = item.querySelector(".jlr-electrifying-power__item__title");
      if (tagline && title) {
        const label = tagline.textContent.trim();
        const value = title.textContent.trim().replace(/\s+/g, " ");
        return `${label}: ${value}`;
      }
      return null;
    }).filter(Boolean);
    const ctaLinks = Array.from(element.querySelectorAll(".jlr-column-template__link a, .jlr-electrifying-power__copy a.jlr-cta, .jlr-electrifying-power__copy a.jlr-button"));
    const img = element.querySelector(".jlr-electrifying-power__image img") || element.querySelector("picture img");
    const textCell = [];
    if (heading) {
      const h2 = document.createElement("h2");
      h2.textContent = heading.textContent.trim();
      textCell.push(h2);
    }
    let textContent = "";
    if (desc) {
      textContent = desc.textContent.trim().replace(/<[^>]+>/g, "");
    }
    if (specs.length > 0) {
      const specLine = specs.join(" / ");
      textContent = textContent ? `${textContent} ${specLine}` : specLine;
    }
    if (textContent) {
      textCell.push(textContent);
    }
    ctaLinks.forEach((link) => {
      const a = document.createElement("a");
      a.href = link.getAttribute("href");
      a.textContent = link.textContent.trim();
      textCell.push(a);
    });
    const imageCell = [];
    if (img) {
      const imgEl = document.createElement("img");
      imgEl.src = img.getAttribute("src");
      imgEl.alt = img.getAttribute("alt") || "";
      imageCell.push(imgEl);
    }
    const copyEl = element.querySelector(".jlr-electrifying-power__copy");
    const imageEl = element.querySelector(".jlr-electrifying-power__image");
    let textFirst = true;
    if (copyEl && imageEl) {
      const position = copyEl.compareDocumentPosition(imageEl);
      textFirst = !!(position & Node.DOCUMENT_POSITION_FOLLOWING);
    }
    if (textFirst) {
      cells.push([textCell, imageCell]);
    } else {
      cells.push([imageCell, textCell]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabbed-component.js
  function parse10(element, { document }) {
    const cells = [];
    const tabbed = element.classList.contains("jlr-tabbed-component") ? element : element.querySelector(".jlr-tabbed-component");
    if (!tabbed) {
      element.remove();
      return;
    }
    const img = tabbed.querySelector(".jlr-image-component img") || tabbed.querySelector("img");
    const copyBox = tabbed.querySelector(".jlr-copy-box") || tabbed.querySelector(".jlr-tabbed-component__copy-box");
    const heading = copyBox ? copyBox.querySelector(".jlr-copy-box__heading") || copyBox.querySelector("h2") : null;
    const desc = copyBox ? copyBox.querySelector(".jlr-copy-box__paragraph") || copyBox.querySelector(".jlr-paragraph") : null;
    const imageCell = [];
    if (img) {
      const imgEl = document.createElement("img");
      imgEl.src = img.getAttribute("src");
      imgEl.alt = img.getAttribute("alt") || "";
      imageCell.push(imgEl);
    }
    const textCell = [];
    if (heading) {
      const h2 = document.createElement("h2");
      h2.textContent = heading.textContent.trim();
      textCell.push(h2);
    }
    if (desc) {
      textCell.push(desc.textContent.trim());
    }
    const ctaContainer = copyBox || tabbed;
    const ctaLinks = Array.from(
      ctaContainer.querySelectorAll("a.jlr-button, a.jlr-cta")
    );
    ctaLinks.forEach((link) => {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = link.getAttribute("href");
      a.textContent = link.textContent.trim();
      p.appendChild(a);
      textCell.push(p);
    });
    if (imageCell.length > 0 || textCell.length > 0) {
      cells.push([imageCell, textCell]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/section-metadata.js
  var THEME_MAP = {
    "jlr-section--dark-theme": "dark",
    "jlr-section--light-theme": "light",
    "jlr-section--grey-theme": "disclaimer"
  };
  function getStyleValue(themeClass) {
    return THEME_MAP[themeClass] || null;
  }
  function createSectionMetadata(document, themeClass) {
    const style = THEME_MAP[themeClass];
    if (!style) return null;
    const cells = [
      [["Style"], [style]]
    ];
    return WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells });
  }

  // tools/importer/page-transformers/vehicle-model-overview.js
  function getBlockType(section) {
    if (!section) return "unknown";
    const cls = section.className || "";
    if (cls.includes("jlr-immersive-hero")) return "hero";
    if (cls.includes("ready-to-go-bar")) return "floating-quicklinks";
    if (cls.includes("jlr-in-page-navigation")) return "remove";
    if (cls.includes("jlr-html-box")) return "remove";
    if (cls.includes("jlr-hero-slider-wrapper")) return "hero-image-carousel";
    if (cls.includes("jlr-dual-frame-carousel")) return "carousel";
    if (cls.includes("jlr-hotspots-container")) return "hotspots";
    if (cls.includes("jlr-electrifying-power")) return "electrifying-power";
    if (cls.includes("jlr-masonry-block")) return "columns-masonry";
    if (cls.includes("jlr-collection-carousel")) return "cards-collection";
    if (section.querySelector(".jlr-image-box-holder") || section.querySelector(".jlr-image-box")) return "image-box";
    if (section.querySelector(".jlr-content-blocks")) return "cards";
    if (section.querySelector(".jlr-tabbed-component")) return "tabbed-component";
    const snippet = section.querySelector(".jlr-snippet");
    if (snippet) {
      if (snippet.classList.contains("jlr-snippet--disclaimer") || section.querySelector(".jlr-snippet--disclaimer")) {
        return "disclaimer";
      }
      return "snippet";
    }
    if (cls.includes("jlr-tabs") || section.querySelector(".jlr-tabs__navigation")) return "tab-nav";
    return "unknown";
  }
  function getTheme(section) {
    const cls = section.className || "";
    if (cls.includes("jlr-section--dark-theme")) return "jlr-section--dark-theme";
    if (cls.includes("jlr-section--light-theme")) return "jlr-section--light-theme";
    if (cls.includes("jlr-section--grey-theme")) return "jlr-section--grey-theme";
    return null;
  }
  function callParser(parser, section, document) {
    const wrapper = document.createElement("div");
    wrapper.appendChild(section);
    parser(section, { document });
    return Array.from(wrapper.childNodes);
  }
  function createHr(document) {
    return document.createElement("hr");
  }
  function createHeading(document, text, level) {
    const h = document.createElement(`h${level}`);
    h.textContent = text;
    return h;
  }
  function createParagraph(document, text) {
    const p = document.createElement("p");
    p.textContent = text;
    return p;
  }
  function createLink(document, href, text) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    return a;
  }
  function createHotspotsBlock(document, hotspotsData) {
    const cells = [];
    hotspotsData.forEach((data) => {
      if (data.tabLabel) {
        const strong = document.createElement("strong");
        strong.textContent = data.tabLabel;
        cells.push([[strong], [""]]);
      }
      if (data.img) {
        cells.push([[data.img], [""]]);
      }
      const count = Math.max(data.positions.length, data.cards.length);
      for (let i = 0; i < count; i++) {
        const pos = data.positions[i] || { top: "0", left: "0" };
        const card = data.cards[i] || {};
        const posText = `${pos.top}, ${pos.left}`;
        const contentCell = [];
        if (card.heading) {
          const strong = document.createElement("strong");
          strong.textContent = card.heading;
          contentCell.push(strong);
        }
        if (card.paragraph) {
          if (contentCell.length > 0) {
            contentCell.push(document.createElement("br"));
          }
          contentCell.push(card.paragraph);
        }
        cells.push([[posText], contentCell.length > 0 ? contentCell : [""]]);
      }
    });
    return WebImporter.Blocks.createBlock(document, { name: "Hotspots", cells });
  }
  function extractSnippetContent(section, document) {
    const elements = [];
    const snippet = section.querySelector(".jlr-snippet");
    if (!snippet) return elements;
    const heading = snippet.querySelector(".jlr-snippet__heading");
    if (heading) {
      elements.push(createHeading(document, heading.textContent.trim(), 2));
    }
    const paragraph = snippet.querySelector(".jlr-snippet__paragraph");
    if (paragraph) {
      elements.push(createParagraph(document, paragraph.textContent.trim()));
    }
    const buttons = Array.from(snippet.querySelectorAll(".jlr-snippet__button, .jlr-snippet__container-buttons a"));
    buttons.forEach((btn) => {
      elements.push(createLink(document, btn.getAttribute("href"), btn.textContent.trim()));
    });
    return elements;
  }
  function extractDisclaimerContent(section, document) {
    const elements = [];
    const disclaimer = section.querySelector(".jlr-snippet--disclaimer");
    if (!disclaimer) return elements;
    const paragraphs = Array.from(disclaimer.querySelectorAll(".jlr-paragraph p, .jlr-paragraph"));
    paragraphs.forEach((p) => {
      const text = p.textContent.trim();
      if (text) {
        elements.push(createParagraph(document, text));
      }
    });
    if (elements.length === 0) {
      const text = disclaimer.textContent.trim();
      if (text) {
        elements.push(createParagraph(document, text));
      }
    }
    return elements;
  }
  function parseCollectionCarousel(section, document) {
    const cells = [];
    const slides = Array.from(
      section.querySelectorAll(".jlr-collection-carousel__slide")
    ).filter((s) => !s.classList.contains("swiper-slide-duplicate"));
    slides.forEach((slide) => {
      const img = slide.querySelector(".jlr-collection-card__image img") || slide.querySelector("img");
      const title = slide.querySelector(".jlr-collection-card__description-title");
      const desc = slide.querySelector(".jlr-collection-card__description-text");
      const imageCell = [];
      if (img) {
        const imgEl = document.createElement("img");
        imgEl.src = img.getAttribute("src");
        imgEl.alt = img.getAttribute("alt") || "";
        imageCell.push(imgEl);
      }
      const textCell = [];
      if (title) {
        const strong = document.createElement("strong");
        strong.textContent = title.textContent.trim();
        textCell.push(strong);
      }
      if (desc) {
        textCell.push(desc.textContent.trim());
      }
      cells.push([imageCell, textCell]);
    });
    return WebImporter.Blocks.createBlock(document, { name: "Cards", cells });
  }
  function transform2(main, document, url) {
    const output = document.createElement("div");
    const renderBlocks = Array.from(main.querySelectorAll(".rdx-render-block"));
    let pendingSnippet = null;
    let pendingTabLabels = [];
    let pendingHotspots = [];
    for (let i = 0; i < renderBlocks.length; i++) {
      const renderBlock = renderBlocks[i];
      const section = renderBlock.querySelector(":scope > section") || renderBlock.querySelector("section");
      if (!section) continue;
      const blockType = getBlockType(section);
      const theme = getTheme(section);
      if (blockType === "remove") continue;
      if (blockType === "tab-nav") {
        const buttons = Array.from(
          section.querySelectorAll(".jlr-tabs__navigation button")
        );
        pendingTabLabels = buttons.map((b) => b.textContent.trim());
        continue;
      }
      if (blockType === "snippet") {
        pendingSnippet = extractSnippetContent(section, document);
        continue;
      }
      if (blockType !== "hotspots" && pendingHotspots.length > 0) {
        const hotspotBlock = createHotspotsBlock(document, pendingHotspots);
        output.appendChild(hotspotBlock);
        output.appendChild(createHr(document));
        pendingHotspots = [];
      }
      if (pendingSnippet) {
        pendingSnippet.forEach((el) => output.appendChild(el));
        pendingSnippet = null;
      }
      let blockElements = [];
      switch (blockType) {
        case "hero": {
          const nodes = callParser(parse2, section, document);
          blockElements = nodes;
          break;
        }
        case "floating-quicklinks": {
          const nodes = callParser(parse3, section, document);
          blockElements = nodes;
          break;
        }
        case "image-box": {
          const nodes = callParser(parse5, section, document);
          blockElements = nodes;
          break;
        }
        case "cards": {
          const nodes = callParser(parse6, section, document);
          blockElements = nodes;
          break;
        }
        case "cards-collection": {
          const block = parseCollectionCarousel(section, document);
          blockElements = [block];
          break;
        }
        case "hero-image-carousel": {
          const nodes = callParser(parse4, section, document);
          blockElements = nodes;
          break;
        }
        case "carousel": {
          const nodes = callParser(parse7, section, document);
          blockElements = nodes;
          break;
        }
        case "columns-masonry": {
          const nodes = callParser(parse8, section, document);
          blockElements = nodes;
          break;
        }
        case "hotspots": {
          const hotspotData = extractHotspotData(section, document);
          hotspotData.tabLabel = pendingTabLabels.shift() || "";
          pendingHotspots.push(hotspotData);
          continue;
        }
        case "electrifying-power": {
          const nodes = callParser(parse9, section, document);
          blockElements = nodes;
          break;
        }
        case "tabbed-component": {
          const nodes = callParser(parse10, section, document);
          blockElements = nodes;
          break;
        }
        case "disclaimer": {
          const disclaimerElements = extractDisclaimerContent(section, document);
          disclaimerElements.forEach((el) => output.appendChild(el));
          const disclaimerMeta = createSectionMetadata(document, "jlr-section--grey-theme");
          if (disclaimerMeta) {
            output.appendChild(disclaimerMeta);
          }
          output.appendChild(createHr(document));
          continue;
        }
        default:
          continue;
      }
      blockElements.forEach((el) => output.appendChild(el));
      if (theme) {
        const style = getStyleValue(theme);
        if (style) {
          const sectionMeta = createSectionMetadata(document, theme);
          if (sectionMeta) {
            output.appendChild(sectionMeta);
          }
        }
      }
      output.appendChild(createHr(document));
    }
    if (pendingHotspots.length > 0) {
      const hotspotBlock = createHotspotsBlock(document, pendingHotspots);
      output.appendChild(hotspotBlock);
      output.appendChild(createHr(document));
    }
    const metadataBlock = createMetadataBlock(document);
    if (metadataBlock) {
      output.appendChild(metadataBlock);
    }
    return output;
  }

  // tools/importer/page-transformers/vehicle-family-overview.js
  function transform3(main, document, url) {
    return transform2(main, document, url);
  }

  // tools/importer/transformers/landrover-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function removeElements(root, selectors) {
    if (typeof WebImporter !== "undefined" && WebImporter.DOMUtils && WebImporter.DOMUtils.remove) {
      WebImporter.DOMUtils.remove(root, selectors);
    } else {
      selectors.forEach((selector) => {
        root.querySelectorAll(selector).forEach((el) => el.remove());
      });
    }
  }
  function transform4(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      removeElements(element, [
        ".lrdx-navigation",
        ".lrdx-navigation-overlay"
      ]);
      removeElements(element, [
        ".cookie-consent",
        ".cookie-consent__default-placeholder"
      ]);
      removeElements(element, [".jlr-banner-manager"]);
      removeElements(element, [
        ".jlr-loader",
        ".jlr-native-video-frame__loader"
      ]);
      removeElements(element, [".rdx-render-block__options"]);
      removeElements(element, [".jlr-overlay"]);
      removeElements(element, [
        ".jlr-button__icon",
        ".jlr-cta__icon",
        ".jlr-dual-frame-carousel__yt-icon-box"
      ]);
      removeElements(element, [".jlr-immersive-hero__slide-down"]);
      removeElements(element, [
        ".breadcrumbs-container",
        ".breadcrumbs-seo"
      ]);
      removeElements(element, [".jlr-in-page-navigation"]);
      removeElements(element, [".jlr-html-box"]);
      removeElements(element, [
        ".swiper-pagination",
        ".swiper-button-next",
        ".swiper-button-prev",
        ".jlr-carousel__loader-box",
        ".jlr-carousel__hero-pagination",
        ".jlr-carousel__hero-navigation-prev",
        ".jlr-carousel__hero-navigation-next",
        ".jlr-hero-carousel-core__container-end",
        ".jlr-slider__pagination",
        ".jlr-slider__navigation-prev",
        ".jlr-slider__navigation-next"
      ]);
      removeElements(element, [
        ".jlr-hotspot",
        ".jlr-hotspots-container__text"
      ]);
      removeElements(element, [
        ".jlr-footer",
        "footer",
        ".footer-disclaimer"
      ]);
      removeElements(element, [".jlr-cookie-banner"]);
      if (element.style && element.style.overflow === "hidden") {
        element.setAttribute("style", "overflow: scroll;");
      }
    }
    if (hookName === TransformHook.afterTransform) {
      removeElements(element, [
        "source",
        "noscript",
        "link"
      ]);
      const allElements = element.querySelectorAll("*");
      allElements.forEach((el) => {
        el.removeAttribute("data-gtm");
        el.removeAttribute("data-analytics");
        el.removeAttribute("onclick");
      });
    }
  }

  // tools/importer/import.js
  function detectTemplate(url) {
    const path = new URL(url).pathname.replace(/\/$/, "");
    const segments = path.split("/").filter(Boolean);
    if (segments.length <= 1) return "homepage";
    if (segments.length === 3 && segments[2] === "overview") {
      return "vehicle-family-overview";
    }
    if (segments.length >= 4 && segments[segments.length - 1] === "overview") {
      return "vehicle-model-overview";
    }
    return "vehicle-model-overview";
  }
  function injectHotspotData(document, html) {
    if (!html) return;
    const hotspotContainers = Array.from(
      document.querySelectorAll(".jlr-hotspots-container")
    );
    if (hotspotContainers.length === 0) return;
    try {
      const match = html.match(/window\.__NUXT__\s*=\s*(\(function\([\s\S]*?\)\([\s\S]*?\)\))\s*;?\s*<\/script>/);
      if (!match) return;
      const nuxt = new Function("return " + match[1])();
      if (!nuxt || !nuxt.data || !nuxt.data[0] || !nuxt.data[0].blocks) return;
      const blocks = nuxt.data[0].blocks;
      const nuxtHotspots = blocks.filter(
        (b) => b && b.attributes && b.attributes.key === "jlr-hotspots-container"
      );
      hotspotContainers.forEach((container, idx) => {
        const nuxtBlock = nuxtHotspots[idx];
        if (nuxtBlock && nuxtBlock.attributes && nuxtBlock.attributes.field_groups) {
          const cards = nuxtBlock.attributes.field_groups.map((group) => {
            let heading = "";
            let paragraph = "";
            for (let fi = 0; fi < group.length; fi++) {
              const fkey = group[fi].key || group[fi].symbol || "";
              if (fkey === "heading" && group[fi].value) heading = String(group[fi].value);
              if (fkey === "paragraph" && group[fi].value) paragraph = String(group[fi].value);
            }
            return { heading, paragraph };
          });
          container.setAttribute("data-hotspot-cards", JSON.stringify(cards));
        }
      });
    } catch (e) {
    }
  }
  var import_default = {
    /**
     * Apply DOM operations to the provided document and return
     * the root element to be then transformed to Markdown.
     */
    transformDOM({ document, url, html, params }) {
      injectHotspotData(document, html);
      transform4("beforeTransform", document.body, { document, url, html, params });
      const template = detectTemplate(url);
      const main = document.querySelector("#rdx-render") || document.querySelector(".blocks-list") || document.querySelector(".jlr-content") || document.body;
      let result;
      switch (template) {
        case "homepage":
          result = transform(main, document, url);
          break;
        case "vehicle-family-overview":
          result = transform3(main, document, url);
          break;
        case "vehicle-model-overview":
        default:
          result = transform2(main, document, url);
          break;
      }
      transform4("afterTransform", result, { document, url, html, params });
      return result;
    },
    /**
     * Return a path that describes the document being transformed.
     */
    generateDocumentPath({ document, url }) {
      const u = new URL(url);
      let path = u.pathname.replace(/\/$/, "") || "/index";
      return WebImporter.FileUtils.sanitizePath(path);
    }
  };
  return __toCommonJS(import_exports);
})();
