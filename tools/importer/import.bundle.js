var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
        const videoSource = item.querySelector("video source");
        if (videoSource && videoSource.src) {
          const videoLink = document.createElement("a");
          videoLink.href = videoSource.src;
          videoLink.textContent = "video";
          body.appendChild(videoLink);
        }
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
    let heroImage = element.querySelector(".jlr-immersive-hero__auto-column--big img") || element.querySelector(".jlr-immersive-hero img");
    if (!heroImage) {
      const video = element.querySelector(".jlr-immersive-hero__video video[poster]") || element.querySelector("video[poster]");
      if (video && video.getAttribute("poster")) {
        heroImage = document.createElement("img");
        heroImage.src = video.getAttribute("poster");
        heroImage.alt = "";
      }
    }
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
    const wrapper = document.createElement("div");
    if (subtitle) {
      const p = document.createElement("p");
      p.textContent = subtitle.textContent.trim();
      wrapper.appendChild(p);
    }
    ctaLinks.forEach((link) => {
      const a = document.createElement("a");
      a.href = link.getAttribute("href");
      a.textContent = link.textContent.trim();
      wrapper.appendChild(a);
    });
    const videoSource = element.querySelector(".jlr-immersive-hero__video video source[src]") || element.querySelector(".jlr-native-video-frame video source[src]") || element.querySelector("video source[src]");
    if (videoSource) {
      const videoLink = document.createElement("a");
      videoLink.href = videoSource.getAttribute("src");
      videoLink.textContent = "video";
      wrapper.appendChild(videoLink);
    }
    if (wrapper.childNodes.length > 0) {
      cells.push([wrapper]);
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
  function cleanParagraph(text) {
    if (!text) return text;
    return text.replace(/&nbsp;/gi, " ").replace(/\u00a0/g, " ").trim();
  }
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
        cards = JSON.parse(cardsJson).map((card) => __spreadProps(__spreadValues({}, card), {
          paragraph: cleanParagraph(card.paragraph)
        }));
      } catch (e) {
      }
    }
    return { img: imgEl, positions, cards };
  }

  // tools/importer/parsers/electrifying-power.js
  function parseTitleHtml(titleHtml) {
    if (!titleHtml) return { value: "", unit: "" };
    const spanMatch = titleHtml.match(/<span[^>]*>([\s\S]*?)<\/span>/);
    if (spanMatch) {
      const value = spanMatch[1].trim();
      let rest = titleHtml.substring(titleHtml.indexOf("</span>") + 7);
      rest = rest.replace(/<sup[^>]*>([\s\S]*?)<\/sup>/g, "$1");
      rest = rest.replace(/<[^>]+>/g, "").trim();
      return { value, unit: rest };
    }
    const text = titleHtml.replace(/<[^>]+>/g, "").trim();
    const match = text.match(/^([\d,.]+)\s*(.*)/);
    if (match) {
      return { value: match[1], unit: match[2] };
    }
    return { value: text, unit: "" };
  }
  function decodeEntities(text) {
    if (!text) return "";
    return text.replace(/&nbsp;/gi, " ").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&amp;/gi, "&").replace(/&#x26;/gi, "&").replace(/\u00a0/g, " ");
  }
  function cleanDisclaimer(html) {
    if (!html) return "";
    return html.replace(/<sup[^>]*>([\s\S]*?)<\/sup>/g, "$1").replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/\u00a0/g, " ").trim();
  }
  function cleanParagraph2(html) {
    if (!html) return "";
    return html.replace(/<sub[^>]*>([\s\S]*?)<\/sub>/g, "$1").replace(/<sup[^>]*>([\s\S]*?)<\/sup>/g, "$1").replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/\u00a0/g, " ").trim();
  }
  function extractElectrifyingPowerData(element, document) {
    const result = {
      heading: "",
      paragraph: "",
      isReversed: false,
      image: null,
      stats: [],
      ctas: []
    };
    const injectedJson = element.getAttribute("data-electrifying-power");
    if (injectedJson) {
      try {
        const data = JSON.parse(injectedJson);
        result.heading = data.heading || "";
        result.paragraph = cleanParagraph2(data.paragraph || "");
        result.isReversed = !!data.isReversed;
        if (data.image) {
          const img = document.createElement("img");
          img.src = data.image;
          img.alt = data.imageAlt || result.heading || "";
          result.image = img;
        }
        result.stats = (data.stats || []).map((stat) => {
          const { value, unit } = parseTitleHtml(stat.title);
          return {
            tagline: decodeEntities((stat.tagline || "").replace(/<[^>]+>/g, "").trim()),
            value: decodeEntities(value),
            unit: decodeEntities(unit),
            disclaimer: cleanDisclaimer(stat.disclaimer)
          };
        });
      } catch (e) {
      }
    }
    if (result.stats.length === 0) {
      const items = Array.from(element.querySelectorAll('[class*="electrifying-power__item"]'));
      result.stats = items.map((item) => {
        const taglineEl = item.querySelector('[class*="tagline"]');
        const titleEl = item.querySelector('[class*="title"]');
        const disclaimerEl = item.querySelector('[class*="disclaimer"]');
        const titleText = titleEl ? titleEl.textContent.trim().replace(/\s+/g, "") : "";
        const valMatch = titleText.match(/^([\d,.]+)(.*)/);
        return {
          tagline: taglineEl ? taglineEl.textContent.trim() : "",
          value: valMatch ? valMatch[1] : titleText,
          unit: valMatch ? valMatch[2] : "",
          disclaimer: disclaimerEl ? disclaimerEl.textContent.trim() : ""
        };
      }).filter((s) => s.tagline || s.value);
    }
    if (!result.heading) {
      const h = element.querySelector(".jlr-column-template__heading") || element.querySelector(".jlr-electrifying-power__copy h2");
      if (h) result.heading = h.textContent.trim();
    }
    if (!result.paragraph) {
      const p = element.querySelector(".jlr-column-template__paragraph");
      if (p) result.paragraph = p.textContent.trim();
    }
    if (!result.image) {
      const img = element.querySelector(".jlr-electrifying-power__image img") || element.querySelector("picture img");
      if (img) {
        const imgEl = document.createElement("img");
        imgEl.src = img.getAttribute("src");
        imgEl.alt = img.getAttribute("alt") || "";
        result.image = imgEl;
      }
    }
    if (!result.isReversed) {
      const copyEl = element.querySelector(".jlr-electrifying-power__copy");
      const imageEl = element.querySelector(".jlr-electrifying-power__image");
      if (copyEl && imageEl) {
        const position = copyEl.compareDocumentPosition(imageEl);
        result.isReversed = !(position & Node.DOCUMENT_POSITION_FOLLOWING);
      }
    }
    const ctaLinks = Array.from(element.querySelectorAll(
      ".jlr-column-template__link a, .jlr-electrifying-power__copy a.jlr-cta, .jlr-electrifying-power__copy a.jlr-button"
    ));
    result.ctas = ctaLinks.map((link) => ({
      href: link.getAttribute("href"),
      text: link.textContent.trim()
    }));
    return result;
  }

  // tools/importer/parsers/tabbed-component.js
  function cleanParagraph3(html) {
    if (!html) return "";
    let text = html.replace(/<li[^>]*>/gi, "\u2022 ");
    text = text.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<[^>]+>/g, "");
    text = text.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&#x26;/gi, "&").replace(/\u00a0/g, " ");
    return text.split("\n").map((line) => line.trim()).filter((line) => line).join("\n");
  }
  function extractTabbedComponentData(element, document) {
    const result = {
      tabs: [],
      isEditionChooser: false
    };
    const tabbed = element.classList.contains("jlr-tabbed-component") ? element : element.querySelector(".jlr-tabbed-component");
    if (!tabbed) return result;
    const injectedJson = tabbed.getAttribute("data-tabbed-component");
    if (injectedJson) {
      try {
        const data = JSON.parse(injectedJson);
        if (data.tabs && data.tabs.length > 0) {
          result.tabs = data.tabs.map((tab) => {
            const tabObj = {
              tabLabel: tab.tabLabel || "",
              heading: tab.heading || "",
              paragraph: cleanParagraph3(tab.paragraph || ""),
              image: null,
              ctas: []
            };
            if (tab.image) {
              const img = document.createElement("img");
              img.src = tab.image;
              img.alt = tab.heading || tab.tabLabel || "";
              tabObj.image = img;
            }
            if (tab.links && tab.links.length > 0) {
              tabObj.ctas = tab.links.map((link) => ({
                href: link.url || "",
                text: link.text || ""
              }));
            }
            return tabObj;
          });
          const firstTab = result.tabs[0];
          result.isEditionChooser = !!(firstTab.heading && firstTab.paragraph && firstTab.image);
        }
      } catch (e) {
      }
    }
    if (result.tabs.length === 0) {
      const copyBox = tabbed.querySelector(".jlr-copy-box") || tabbed.querySelector(".jlr-tabbed-component__copy-box");
      const heading = copyBox ? copyBox.querySelector(".jlr-copy-box__heading") || copyBox.querySelector("h2") : null;
      const desc = copyBox ? copyBox.querySelector(".jlr-copy-box__paragraph") || copyBox.querySelector(".jlr-paragraph") : null;
      const img = tabbed.querySelector(".jlr-image-component img") || tabbed.querySelector("img");
      const tabButtons = Array.from(
        tabbed.querySelectorAll(".jlr-tabs__navigation button")
      );
      const activeLabel = tabButtons.length > 0 ? tabButtons[0].textContent.trim() : "";
      const tab = {
        tabLabel: activeLabel,
        heading: heading ? heading.textContent.trim() : "",
        paragraph: desc ? desc.textContent.trim() : "",
        image: null,
        ctas: []
      };
      if (img) {
        const imgEl = document.createElement("img");
        imgEl.src = img.getAttribute("src");
        imgEl.alt = img.getAttribute("alt") || "";
        tab.image = imgEl;
      }
      const ctaContainer = copyBox || tabbed;
      const ctaLinks = Array.from(
        ctaContainer.querySelectorAll("a.jlr-button, a.jlr-cta")
      );
      tab.ctas = ctaLinks.map((link) => ({
        href: link.getAttribute("href"),
        text: link.textContent.trim()
      }));
      if (tab.heading || tab.paragraph || tab.image) {
        result.tabs.push(tab);
        result.isEditionChooser = !!(tab.heading && tab.paragraph && tab.image);
      }
    }
    return result;
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
          const span = document.createElement("span");
          span.innerHTML = card.paragraph;
          contentCell.push(span);
        }
        const imageCell = [];
        if (card.image) {
          const imgEl = document.createElement("img");
          imgEl.src = card.image;
          imgEl.alt = card.heading || "";
          imageCell.push(imgEl);
        }
        cells.push([
          [posText],
          contentCell.length > 0 ? contentCell : [""],
          imageCell.length > 0 ? imageCell : [""]
        ]);
      }
    });
    return WebImporter.Blocks.createBlock(document, { name: "Hotspots", cells });
  }
  function createElectrifyingPowerBlock(document, epDataArray) {
    const cells = [];
    epDataArray.forEach((data) => {
      if (data.tabLabel) {
        const strong = document.createElement("strong");
        strong.textContent = data.tabLabel;
        cells.push([[strong], [""], [""], [""]]);
      }
      data.stats.forEach((stat) => {
        const taglineSpan = document.createElement("span");
        taglineSpan.textContent = stat.tagline;
        const valueSpan = document.createElement("span");
        valueSpan.textContent = stat.value;
        const unitSpan = document.createElement("span");
        unitSpan.textContent = stat.unit;
        const disclaimerSpan = document.createElement("span");
        disclaimerSpan.textContent = stat.disclaimer;
        cells.push([
          [taglineSpan],
          [valueSpan],
          [unitSpan],
          [disclaimerSpan]
        ]);
      });
      if (data.heading) {
        const h3 = document.createElement("h3");
        h3.textContent = data.heading;
        cells.push([[h3], [""], [""], [""]]);
      }
      if (data.paragraph) {
        const p = document.createElement("p");
        p.textContent = data.paragraph;
        cells.push([[p], [""], [""], [""]]);
      }
      data.ctas.forEach((cta) => {
        const a = document.createElement("a");
        a.href = cta.href;
        a.textContent = cta.text;
        cells.push([[a], [""], [""], [""]]);
      });
      if (data.image) {
        cells.push([[data.image], [""], [""], [""]]);
      }
      if (data.isReversed) {
        cells.push([["reversed"], [""], [""], [""]]);
      }
    });
    return WebImporter.Blocks.createBlock(document, {
      name: "Electrifying Power",
      cells
    });
  }
  function createEditionChooserBlock(document, tabsData) {
    const cells = [];
    tabsData.forEach((tab) => {
      if (tab.tabLabel) {
        const strong = document.createElement("strong");
        strong.textContent = tab.tabLabel;
        cells.push([[strong]]);
      }
      if (tab.image) {
        cells.push([[tab.image]]);
      }
      if (tab.heading) {
        const h3 = document.createElement("h3");
        h3.textContent = tab.heading;
        cells.push([[h3]]);
      }
      if (tab.paragraph) {
        const lines = tab.paragraph.split("\n").filter((l) => l.trim());
        const hasBullets = lines.some((l) => l.startsWith("\u2022") || l.startsWith("-"));
        if (hasBullets) {
          const ul = document.createElement("ul");
          lines.forEach((line) => {
            const li = document.createElement("li");
            li.textContent = line.replace(/^[•\-]\s*/, "").trim();
            ul.appendChild(li);
          });
          cells.push([[ul]]);
        } else {
          const p = document.createElement("p");
          p.textContent = tab.paragraph;
          cells.push([[p]]);
        }
      }
      tab.ctas.forEach((cta) => {
        const a = document.createElement("a");
        a.href = cta.href;
        a.textContent = cta.text;
        cells.push([[a]]);
      });
    });
    return WebImporter.Blocks.createBlock(document, {
      name: "Edition Chooser",
      cells
    });
  }
  function createBuildAndOrderBlock(document, boData) {
    const cells = [];
    boData.models.forEach((model) => {
      if (model.name) {
        const h3 = document.createElement("h3");
        h3.textContent = model.name;
        cells.push([[h3], [""]]);
      }
      model.trims.forEach((trim) => {
        const labelCell = [];
        if (trim.label) {
          const strong = document.createElement("strong");
          strong.textContent = trim.label;
          labelCell.push(strong);
        }
        const imageCell = [];
        if (trim.image) {
          const img = document.createElement("img");
          img.src = trim.image;
          img.alt = trim.label || "";
          imageCell.push(img);
        }
        cells.push([labelCell, imageCell]);
      });
    });
    const primaryCtas = boData.ctas.filter((c) => c.primary);
    const secondaryCtas = boData.ctas.filter((c) => !c.primary);
    const col1 = [];
    primaryCtas.forEach((cta) => {
      const a = document.createElement("a");
      a.href = cta.href;
      a.textContent = cta.text;
      const strong = document.createElement("strong");
      strong.appendChild(a);
      col1.push(strong);
    });
    const col2 = [];
    secondaryCtas.forEach((cta) => {
      const a = document.createElement("a");
      a.href = cta.href;
      a.textContent = cta.text;
      col2.push(a);
    });
    if (col1.length > 0 || col2.length > 0) {
      cells.push([col1.length > 0 ? col1 : [""], col2.length > 0 ? col2 : [""]]);
    }
    return WebImporter.Blocks.createBlock(document, {
      name: "Build And Order",
      cells
    });
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
    const sourceP = disclaimer.querySelector(".jlr-paragraph p") || disclaimer.querySelector("p");
    if (!sourceP) {
      const text = disclaimer.textContent.trim();
      if (text) elements.push(createParagraph(document, text));
      return elements;
    }
    const childNodes = Array.from(sourceP.childNodes);
    let currentP = document.createElement("p");
    const flushParagraph = () => {
      if (currentP.childNodes.length > 0 && currentP.textContent.trim()) {
        elements.push(currentP);
      }
      currentP = document.createElement("p");
    };
    let prevWasBr = false;
    for (const node of childNodes) {
      const isBr = node.nodeName === "BR";
      if (isBr && prevWasBr) {
        flushParagraph();
        prevWasBr = false;
        continue;
      }
      if (prevWasBr) {
        currentP.appendChild(document.createElement("br"));
      }
      if (isBr) {
        prevWasBr = true;
        continue;
      }
      prevWasBr = false;
      if (node.nodeType === 3) {
        currentP.appendChild(document.createTextNode(node.textContent));
      } else if (node.nodeType === 1) {
        currentP.appendChild(node.cloneNode(true));
      }
    }
    flushParagraph();
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
    let pendingEP = [];
    for (let i = 0; i < renderBlocks.length; i++) {
      const renderBlock = renderBlocks[i];
      const section = renderBlock.querySelector(":scope > section") || renderBlock.querySelector("section");
      if (!section) continue;
      const blockType = getBlockType(section);
      const theme = getTheme(section);
      if (blockType === "remove") continue;
      if (blockType === "tab-nav") {
        const boAttr = renderBlock.getAttribute("data-build-and-order") || section.getAttribute("data-build-and-order");
        if (boAttr) {
          try {
            const boData = JSON.parse(boAttr);
            if (boData.models && boData.models.length > 0) {
              if (pendingSnippet) {
                pendingSnippet.forEach((el) => output.appendChild(el));
                pendingSnippet = null;
              }
              const boBlock = createBuildAndOrderBlock(document, boData);
              output.appendChild(boBlock);
              output.appendChild(createHr(document));
              let skip = i + 1;
              while (skip < renderBlocks.length) {
                const nextSection = renderBlocks[skip].querySelector(":scope > section") || renderBlocks[skip].querySelector("section");
                if (nextSection && nextSection.querySelector(".jlr-tabbed-component")) {
                  skip++;
                } else {
                  break;
                }
              }
              if (skip < renderBlocks.length) {
                const nextSection = renderBlocks[skip].querySelector(":scope > section") || renderBlocks[skip].querySelector("section");
                if (nextSection && nextSection.querySelector(".jlr-snippet") && !nextSection.querySelector(".jlr-snippet--disclaimer")) {
                  skip++;
                }
              }
              i = skip - 1;
              continue;
            }
          } catch (e) {
          }
        }
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
      if (blockType !== "electrifying-power" && pendingEP.length > 0) {
        const epBlock = createElectrifyingPowerBlock(document, pendingEP);
        output.appendChild(epBlock);
        output.appendChild(createHr(document));
        pendingEP = [];
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
          const epData = extractElectrifyingPowerData(section, document);
          epData.tabLabel = pendingTabLabels.shift() || "";
          pendingEP.push(epData);
          continue;
        }
        case "tabbed-component": {
          const boAttr = renderBlock.getAttribute("data-build-and-order") || section.getAttribute("data-build-and-order");
          if (boAttr) {
            try {
              const boData = JSON.parse(boAttr);
              if (boData.models && boData.models.length > 0) {
                const boBlock = createBuildAndOrderBlock(document, boData);
                blockElements = [boBlock];
                if (i + 1 < renderBlocks.length) {
                  const nextSection = renderBlocks[i + 1].querySelector(":scope > section") || renderBlocks[i + 1].querySelector("section");
                  if (nextSection && nextSection.querySelector(".jlr-snippet") && !nextSection.querySelector(".jlr-snippet--disclaimer")) {
                    i++;
                  }
                }
                break;
              }
            } catch (e) {
            }
          }
          const tcData = extractTabbedComponentData(section, document);
          if (tcData.isEditionChooser && tcData.tabs.length > 0) {
            const ecBlock = createEditionChooserBlock(document, tcData.tabs);
            blockElements = [ecBlock];
          }
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
    if (pendingEP.length > 0) {
      const epBlock = createElectrifyingPowerBlock(document, pendingEP);
      output.appendChild(epBlock);
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
            let image = "";
            for (let fi = 0; fi < group.length; fi++) {
              const fkey = group[fi].key || group[fi].symbol || "";
              if (fkey === "heading" && group[fi].value) heading = String(group[fi].value);
              if (fkey === "paragraph" && group[fi].value) paragraph = String(group[fi].value);
              if (fkey === "rdx-image" && group[fi].value) {
                try {
                  const imgVal = typeof group[fi].value === "string" ? JSON.parse(group[fi].value) : group[fi].value;
                  if (imgVal && imgVal.id) {
                    image = `https://media.cdn-jaguarlandrover.com/api/v2/images/${imgVal.id}/w/1600/h/900.jpg`;
                  }
                } catch (e) {
                }
              }
            }
            return { heading, paragraph, image };
          });
          container.setAttribute("data-hotspot-cards", JSON.stringify(cards));
        }
      });
    } catch (e) {
    }
  }
  function injectElectrifyingPowerData(document, html) {
    if (!html) return;
    const containers = Array.from(
      document.querySelectorAll(".jlr-electrifying-power")
    );
    if (containers.length === 0) return;
    try {
      const match = html.match(/window\.__NUXT__\s*=\s*(\(function\([\s\S]*?\)\([\s\S]*?\)\))\s*;?\s*<\/script>/);
      if (!match) return;
      const nuxt = new Function("return " + match[1])();
      if (!nuxt || !nuxt.data || !nuxt.data[0] || !nuxt.data[0].blocks) return;
      const blocks = nuxt.data[0].blocks;
      const epBlocks = blocks.filter(
        (b) => b && b.attributes && b.attributes.key === "jlr-electrifying-power"
      );
      containers.forEach((container, idx) => {
        const nuxtBlock = epBlocks[idx];
        if (!nuxtBlock || !nuxtBlock.attributes) return;
        const attrs = nuxtBlock.attributes;
        const data = {
          heading: "",
          paragraph: "",
          isReversed: false,
          image: "",
          imageAlt: "",
          stats: []
        };
        if (attrs.fields) {
          for (let fi = 0; fi < attrs.fields.length; fi++) {
            const f = attrs.fields[fi];
            const sym = f.symbol || f.key || "";
            if (sym === "heading" && f.value) data.heading = String(f.value);
            if (sym === "paragraph" && f.value) data.paragraph = String(f.value);
            if (sym === "is_reversed") data.isReversed = !!f.value;
            if (sym === "rdx-image" && f.value) {
              try {
                const imgVal = typeof f.value === "string" ? JSON.parse(f.value) : f.value;
                if (imgVal && imgVal.id) {
                  data.image = `https://media.cdn-jaguarlandrover.com/api/v2/images/${imgVal.id}/w/1600/h/900.jpg`;
                  data.imageAlt = imgVal.alt || "";
                }
              } catch (e) {
              }
            }
          }
        }
        if (attrs.field_groups) {
          data.stats = attrs.field_groups.map((group) => {
            const stat = { tagline: "", title: "", disclaimer: "" };
            for (let gi = 0; gi < group.length; gi++) {
              const sym = group[gi].symbol || group[gi].key || "";
              if (sym === "tagline" && group[gi].value) stat.tagline = String(group[gi].value);
              if (sym === "title" && group[gi].value) stat.title = String(group[gi].value);
              if (sym === "disclaimer" && group[gi].value) stat.disclaimer = String(group[gi].value);
            }
            return stat;
          });
        }
        container.setAttribute("data-electrifying-power", JSON.stringify(data));
      });
    } catch (e) {
    }
  }
  function injectTabbedComponentData(document, html) {
    if (!html) return;
    const containers = Array.from(
      document.querySelectorAll(".jlr-tabbed-component")
    );
    if (containers.length === 0) return;
    try {
      const match = html.match(/window\.__NUXT__\s*=\s*(\(function\([\s\S]*?\)\([\s\S]*?\)\))\s*;?\s*<\/script>/);
      if (!match) return;
      const nuxt = new Function("return " + match[1])();
      if (!nuxt || !nuxt.data || !nuxt.data[0] || !nuxt.data[0].blocks) return;
      const blocks = nuxt.data[0].blocks;
      const tcBlocks = blocks.filter(
        (b) => b && b.attributes && b.attributes.key === "jlr-tabbed-component"
      );
      containers.forEach((container, idx) => {
        const nuxtBlock = tcBlocks[idx];
        if (!nuxtBlock || !nuxtBlock.attributes) return;
        const attrs = nuxtBlock.attributes;
        const data = {
          tabs: [],
          theme: ""
        };
        if (attrs.fields) {
          for (let fi = 0; fi < attrs.fields.length; fi++) {
            const f = attrs.fields[fi];
            const sym = f.symbol || f.key || "";
            if (sym === "box_color" && f.value) data.theme = String(f.value);
          }
        }
        if (attrs.field_groups) {
          data.tabs = attrs.field_groups.map((group) => {
            const tab = {
              tabLabel: "",
              heading: "",
              paragraph: "",
              image: "",
              links: []
            };
            for (let gi = 0; gi < group.length; gi++) {
              const sym = group[gi].symbol || group[gi].key || "";
              if (sym === "tab_label" && group[gi].value) tab.tabLabel = String(group[gi].value);
              if (sym === "heading" && group[gi].value) tab.heading = String(group[gi].value);
              if (sym === "paragraph" && group[gi].value) tab.paragraph = String(group[gi].value);
              if (sym === "rdx-image" && group[gi].value) {
                try {
                  const imgVal = typeof group[gi].value === "string" ? JSON.parse(group[gi].value) : group[gi].value;
                  if (imgVal && imgVal.id) {
                    tab.image = `https://media.cdn-jaguarlandrover.com/api/v2/images/${imgVal.id}/w/1600/h/900.jpg`;
                  }
                } catch (e) {
                }
              }
              if (sym === "rdx-links" && group[gi].value) {
                const links = Array.isArray(group[gi].value) ? group[gi].value : [];
                tab.links = links.filter((l) => l && l.link_text && l.url).map((l) => ({ text: l.link_text, url: l.url }));
              }
            }
            return tab;
          });
        }
        container.setAttribute("data-tabbed-component", JSON.stringify(data));
      });
    } catch (e) {
    }
  }
  function injectBuildAndOrderData(document, html) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!html) return;
    try {
      const match = html.match(/window\.__NUXT__\s*=\s*(\(function\([\s\S]*?\)\([\s\S]*?\)\))\s*;?\s*<\/script>/);
      if (!match) return;
      const nuxt = new Function("return " + match[1])();
      if (!nuxt || !nuxt.data || !nuxt.data[0] || !nuxt.data[0].blocks) return;
      const blocks = nuxt.data[0].blocks;
      const isTrimChooser = (block) => {
        var _a2;
        const groups = (_a2 = block == null ? void 0 : block.attributes) == null ? void 0 : _a2.field_groups;
        if (!Array.isArray(groups) || groups.length < 2) return false;
        return groups.some((group) => {
          let hasLabel = false;
          let hasImage = false;
          for (let k = 0; k < group.length; k++) {
            const sym = group[k].symbol || group[k].key || "";
            if (sym === "tab_label" && group[k].value) hasLabel = true;
            if (sym === "rdx-image" && group[k].value) hasImage = true;
          }
          return hasLabel && hasImage;
        });
      };
      const hasPopulatedLinks = (fields) => fields.some((f) => {
        if (f.symbol !== "rdx-link" && f.symbol !== "rdx-links") return false;
        return Array.isArray(f.value) && f.value.length > 0;
      });
      const isHeadingSnippet = (block) => {
        var _a2;
        const fields = (_a2 = block == null ? void 0 : block.attributes) == null ? void 0 : _a2.fields;
        if (!Array.isArray(fields)) return false;
        const hasTitle = fields.some((f) => f.symbol === "section_title" && f.value);
        return hasTitle && !hasPopulatedLinks(fields);
      };
      const isCtaSnippet = (block) => {
        var _a2;
        const fields = (_a2 = block == null ? void 0 : block.attributes) == null ? void 0 : _a2.fields;
        if (!Array.isArray(fields)) return false;
        return hasPopulatedLinks(fields);
      };
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (!b || !b.attributes) continue;
        if (b.attributes.key !== "jlr-snippet") continue;
        if (!isHeadingSnippet(b)) continue;
        let j = i + 1;
        if (j >= blocks.length) continue;
        const data = { models: [], ctas: [] };
        if (((_b = (_a = blocks[j]) == null ? void 0 : _a.attributes) == null ? void 0 : _b.key) === "jlr-tabs") {
          if (j + 1 >= blocks.length || ((_d = (_c = blocks[j + 1]) == null ? void 0 : _c.attributes) == null ? void 0 : _d.key) !== "jlr-tabbed-component" || !isTrimChooser(blocks[j + 1])) continue;
          const tabsBlock = blocks[j].attributes;
          const modelLabels = (tabsBlock.field_groups || []).map((g) => {
            for (let k = 0; k < g.length; k++) {
              if ((g[k].symbol || g[k].key) === "tab_label") return String(g[k].value || "");
            }
            return "";
          });
          j++;
          modelLabels.forEach((label) => {
            var _a2, _b2;
            if (j < blocks.length && ((_b2 = (_a2 = blocks[j]) == null ? void 0 : _a2.attributes) == null ? void 0 : _b2.key) === "jlr-tabbed-component") {
              const model = { name: label, trims: [] };
              const groups = blocks[j].attributes.field_groups || [];
              groups.forEach((group) => {
                const trim = { label: "", image: "" };
                for (let k = 0; k < group.length; k++) {
                  const sym = group[k].symbol || group[k].key || "";
                  if (sym === "tab_label" && group[k].value) trim.label = String(group[k].value);
                  if (sym === "rdx-image" && group[k].value) {
                    try {
                      const imgVal = typeof group[k].value === "string" ? JSON.parse(group[k].value) : group[k].value;
                      if (imgVal && imgVal.id) {
                        trim.image = `https://media.cdn-jaguarlandrover.com/api/v2/images/${imgVal.id}/w/1600.jpg`;
                      }
                    } catch (e) {
                    }
                  }
                }
                model.trims.push(trim);
              });
              data.models.push(model);
              j++;
            }
          });
        } else if (((_f = (_e = blocks[j]) == null ? void 0 : _e.attributes) == null ? void 0 : _f.key) === "jlr-tabbed-component" && isTrimChooser(blocks[j])) {
          const model = { name: "", trims: [] };
          const groups = blocks[j].attributes.field_groups || [];
          groups.forEach((group) => {
            const trim = { label: "", image: "" };
            for (let k = 0; k < group.length; k++) {
              const sym = group[k].symbol || group[k].key || "";
              if (sym === "tab_label" && group[k].value) trim.label = String(group[k].value);
              if (sym === "rdx-image" && group[k].value) {
                try {
                  const imgVal = typeof group[k].value === "string" ? JSON.parse(group[k].value) : group[k].value;
                  if (imgVal && imgVal.id) {
                    trim.image = `https://media.cdn-jaguarlandrover.com/api/v2/images/${imgVal.id}/w/1600.jpg`;
                  }
                } catch (e) {
                }
              }
            }
            model.trims.push(trim);
          });
          data.models.push(model);
          j++;
        } else {
          continue;
        }
        if (j >= blocks.length || ((_h = (_g = blocks[j]) == null ? void 0 : _g.attributes) == null ? void 0 : _h.key) !== "jlr-snippet" || !isCtaSnippet(blocks[j])) continue;
        const ctaFields = blocks[j].attributes.fields || [];
        const rdxLinkField = Array.isArray(ctaFields) ? ctaFields.find((f) => f.symbol === "rdx-link") : null;
        if (rdxLinkField && Array.isArray(rdxLinkField.value)) {
          rdxLinkField.value.forEach((link) => {
            if (link && link.link_text && link.url) {
              data.ctas.push({ text: link.link_text, href: link.url, primary: true });
            }
          });
        }
        const rdxLinksField = Array.isArray(ctaFields) ? ctaFields.find((f) => f.symbol === "rdx-links") : null;
        if (rdxLinksField && Array.isArray(rdxLinksField.value)) {
          rdxLinksField.value.forEach((l) => {
            if (l && l.link_text && l.url) {
              data.ctas.push({ text: l.link_text, href: l.url, primary: false });
            }
          });
        }
        if (data.models.length === 0) continue;
        const allRenderBlocks = Array.from(document.querySelectorAll(".rdx-render-block"));
        if (i < allRenderBlocks.length) {
          for (let t = i + 1; t < allRenderBlocks.length; t++) {
            const next = allRenderBlocks[t];
            if (next.querySelector(".jlr-tabs__navigation") || next.querySelector(".jlr-tabbed-component")) {
              next.setAttribute("data-build-and-order", JSON.stringify(data));
              break;
            }
          }
        }
      }
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
      injectElectrifyingPowerData(document, html);
      injectTabbedComponentData(document, html);
      injectBuildAndOrderData(document, html);
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
