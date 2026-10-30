window.__ModuleLoader__.load({
	id: "dsh-plugin-bg-motion",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		/**
		 * Background stage for DSH skins: plays the skin's clip while a turn is
		 * running and shows a fixed still frame the rest of the time.
		 *
		 * Why the plugin paints its own stage instead of styling the skin's <video>:
		 * the skin-center creates that element inside its own decoration layer, and
		 * CSS from the skin cannot reach it reliably (the layer sits in a stacking
		 * context the skin's own selectors only partially address — measured: a probe
		 * rule on `body video` and on the layer never applied, while the plugin's
		 * `querySelector` finds the element every time). Owning the DOM is therefore
		 * the only deterministic way to guarantee "still frame when idle".
		 *
		 * The stage holds two children:
		 *   · <img>   the still frame (a real file next to the clip, same scrim baked in)
		 *   · <video> a muted loop of the same clip, shown only while running
		 * The skin's own video is hidden and paused, so it no longer paints or burns
		 * CPU, and the stage is the only thing visible.
		 *
		 * Busy detection (unchanged):
		 *   1. shell markers   [data-streaming] / [data-running] / composer stop state
		 *   2. MUTATION RATE across the page, composer typing excluded
		 *
		 * NOTE: served as a CLASSIC script (no `export`), failing to load it crashes
		 * web boot ("Unexpected token 'export'").
		 */

		/** Decoration layer attribute stamped by the skin-center. */
		const LAYER_ATTR = "data-dsh-skin-layer";

		/** Layer that carries the background media. */
		const BACKGROUND_LAYER = "background";

		/** File name of the still frame, next to the skin's clip. */
		const STILL_FILE = "sm-idle-16.webp";

		/** Marker attribute on the plugin's own stage. */
		const STAGE_ATTR = "data-bg-motion-stage";

		/** Window used to measure how busy the DOM is. */
		const RATE_WINDOW_MS = 1000;

		/** Mutations inside that window that mean "output is being produced". */
		const RATE_MIN_MUTATIONS = 3;

		/** Mount bursts are ignored for this long after install / navigation. */
		const SETTLE_MS = 1500;

		/** How long the gate stays "running" after the last burst of activity. */
		const HOLD_MS = 3000;

		/** How often the state is re-evaluated. */
		const TICK_MS = 400;

		/** Shell markers that mean "a turn is running". */
		const BUSY_SELECTORS = ["[data-streaming]", "[data-running]"];

		/** Where a running turn writes its output; used to detect navigation. */
		const CONVERSATION_SELECTORS = ["[data-conversation-content]", "[data-chat-flow]", "[data-slot='conversation']"];

		/** Stop-state labels on the composer's primary button (zh + en). */
		const STOP_LABEL = /停止|中止|取消|stop|interrupt/i;

		/**
		 * Whether the composer's primary button is in its "stop" state.
		 *
		 * The only signal that spans a WHOLE turn: `[data-streaming]` appears only
		 * while text is flowing, so relying on activity made the gate flip between
		 * running and idle after every burst — the flicker that was reported.
		 * @param doc - the page document.
		 * @returns whether the composer is offering "stop".
		 */
		function composerOffersStop(doc) {
			try {
				const card = doc.querySelector("[data-composer-card]");
				if (card === null) return false;
				const buttons = card.querySelectorAll("button");
				if (!buttons || typeof buttons.length !== "number") return false;
				let primary = null;
				for (const button of buttons) {
					if (button.hasAttribute("aria-haspopup")) continue;
					primary = button;
				}
				if (primary === null || typeof primary.querySelector !== "function") return false;
				const label = (primary.getAttribute("aria-label") || "") + " " + (primary.getAttribute("title") || "");
				if (STOP_LABEL.test(label)) return true;
				return primary.querySelector("svg rect") !== null;
			} catch {
				return false;
			}
		}

		/**
		 * Whether any explicit busy marker is present.
		 * @param doc - the page document.
		 * @returns whether a marker matched.
		 */
		function hasBusyMarker(doc) {
			for (const selector of BUSY_SELECTORS) {
				if (doc.querySelector(selector) !== null) return true;
			}
			return composerOffersStop(doc);
		}

		/**
		 * The conversation root, used only to notice navigation.
		 * @param doc - the page document.
		 * @returns the node, or null on the new-session screen.
		 */
		function findConversation(doc) {
			for (const selector of CONVERSATION_SELECTORS) {
				const node = doc.querySelector(selector);
				if (node !== null) return node;
			}
			return null;
		}

		/**
		 * Find the skin's background video.
		 * @param doc - the page document.
		 * @returns the element, or null when the active skin paints no video.
		 */
		function findBackgroundVideo(doc) {
			const layer = doc.querySelector(`[${LAYER_ATTR}="${BACKGROUND_LAYER}"]`);
			if (layer === null) return null;
			const video = layer.querySelector("video");
			const Video = doc.defaultView && doc.defaultView.HTMLVideoElement;
			if (typeof Video !== "function") return video;
			return video instanceof Video ? video : null;
		}

		/**
		 * URL of the still frame, resolved next to the clip.
		 * @param video - the skin's background video.
		 * @returns the absolute URL, or null when it cannot be derived.
		 */
		function stillUrl(video) {
			try {
				const base = video.currentSrc || video.src;
				if (!base) return null;
				const url = new URL(base, (video.ownerDocument && video.ownerDocument.baseURI) || "dsh-app://app/");
				const parts = url.pathname.split("/");
				parts[parts.length - 1] = STILL_FILE;
				url.pathname = parts.join("/");
				return url.href;
			} catch {
				return null;
			}
		}

		/**
		 * Start playback, swallowing the rejection a blocked autoplay produces.
		 * @param video - a video element.
		 */
		function play(video) {
			if (!video.paused) return;
			const started = video.play();
			if (started !== undefined && typeof started.catch === "function") started.catch(() => {});
		}

		/**
		 * Whether a mutation happened inside the message composer.
		 *
		 * The composer is contenteditable, so typing mutates a text node per
		 * keystroke; counting those made the background flicker while typing.
		 * @param node - the mutation target.
		 * @returns whether the node belongs to the composer.
		 */
		function insideComposer(node) {
			if (!node) return false;
			const element = node.nodeType === 1 ? node : node.parentElement;
			if (!element || typeof element.closest !== "function") return false;
			return element.closest("[data-composer-card],[data-composer-seat],textarea,[contenteditable='true']") !== null;
		}

		/**
		 * Resolve the page document without touching an un-injected context property.
		 *
		 * Reading `ctx.container` throws unless the plugin declared it in `inject`
		 * ("cannot get property 'container' without inject"), which aborted an earlier
		 * version of this gate entirely.
		 * @param ctx - the client plugin context.
		 * @returns the document, or undefined when neither source could answer.
		 */
		function resolveDocument(ctx) {
			if (typeof document !== "undefined" && document !== null) return document;
			try {
				const container = ctx && ctx.container;
				if (container && container.ownerDocument) return container.ownerDocument;
			} catch {
				/* un-injected property: fall through */
			}
			return undefined;
		}

		/**
		 * Wire the gate.
		 *
		 * Guarded on purpose: a throw during activation fails the whole web boot
		 * ("1 entry did not activate"), and a decoration must never block the app.
		 * @param ctx - the client plugin context.
		 */
		function apply(ctx) {
			try {
				const doc = resolveDocument(ctx);
				if (doc === undefined || doc === null) return;
				const start = install(doc);
				let effect = null;
				try {
					effect = ctx && ctx.effect;
				} catch {
					effect = null;
				}
				if (typeof effect === "function") effect.call(ctx, start, "bg-motion: playback gate");
				else start();
			} catch (error) {
				console.warn("[bg-motion] playback gate not installed:", error);
			}
		}

		/**
		 * The real wiring.
		 * @param doc - the page document.
		 * @returns the disposer that detaches everything.
		 */
		function install(doc) {
			const body = doc.body;

			/** The skin's own video (hidden, paused). */
			let source = null;
			/** The stage the plugin owns. */
			let stage = null;
			/** The conversation node last seen; used to detect navigation. */
			let observed = null;
			/** Mutation timestamps inside the rate window. */
			let stamps = [];
			/** Mutations are ignored until this instant. */
			let settleUntil = 0;
			/** Last state applied. */
			let lastBusy = null;
			/** Last time the rate was high enough to mean "output". */
			let lastActiveAt = 0;
			/** Live observer + ticker. */
			let observer = null;
			let ticker = null;

			/**
			 * Create the stage: still image underneath, clip on top (hidden until a
			 * turn starts).
			 * @param video - the skin's background video, used as the clip source.
			 */
			const buildStage = (video) => {
				removeStage();
				const node = doc.createElement("div");
				node.setAttribute(STAGE_ATTR, "");
				node.setAttribute("aria-hidden", "true");
				node.style.cssText = "position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden;";

				const img = doc.createElement("img");
				img.setAttribute("aria-hidden", "true");
				img.alt = "";
				const still = stillUrl(video);
				if (still !== null) img.src = still;
				img.style.cssText =
					"position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:1;transition:opacity 260ms ease;";

				const clip = doc.createElement("video");
				clip.setAttribute("aria-hidden", "true");
				clip.muted = true;
				clip.loop = true;
				clip.playsInline = true;
				clip.preload = "auto";
				clip.src = video.currentSrc || video.src;
				clip.style.cssText =
					"position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 200ms ease;";

				// The scrim the skin's manifest declares for dark mode, applied to the
				// CLIP only. Without it the clip is the raw 25 s source, whose opening
				// paper is far brighter than the still frame (p95 205 vs 72), so white
				// text became unreadable. A brightness filter could not fix that: the
				// source's bright end stayed bright under any uniform multiply. The
				// still frame already has this exact scrim baked into its pixels, so
				// painting the same gradient over the clip makes both states match.
				const scrim = doc.createElement("div");
				scrim.setAttribute("aria-hidden", "true");
				scrim.style.cssText =
					"position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity 200ms ease;" +
					"background-image:" +
					"linear-gradient(180deg, rgba(23,26,32,0.35) 0%, rgba(23,26,32,0.37) 30%, rgba(23,26,32,0.46) 62%, rgba(23,26,32,0.58) 100%)," +
					"linear-gradient(90deg, rgba(23,26,32,0.08) 0%, rgba(23,26,32,0.30) 13%, rgba(23,26,32,0.55) 30%, rgba(23,26,32,0.56) 100%);" +
					"background-repeat:no-repeat,no-repeat;background-size:100% 100%,100% 100%;";

				node.appendChild(img);
				node.appendChild(clip);
				node.appendChild(scrim);
				body.appendChild(node);
				stage = { node, img, clip, scrim };
			};

			/** Remove the stage and restore the skin's own video. */
			const removeStage = () => {
				if (stage !== null) {
					if (stage.clip && !stage.clip.paused) stage.clip.pause();
					if (stage.node && stage.node.parentElement) stage.node.parentElement.removeChild(stage.node);
				}
				stage = null;
				if (source !== null) source.style.visibility = "";
			};

			/**
			 * Swap the two layers and drive the clip.
			 * @param running - whether a turn is running.
			 * @param fresh - whether this is the transition into the state.
			 */
			const paint = (running, fresh) => {
				if (stage === null) return;
				if (running) {
					stage.img.style.opacity = "0";
					stage.clip.style.opacity = "1";
					if (stage.scrim) stage.scrim.style.opacity = "1";
					if (fresh) {
						try {
							stage.clip.currentTime = 0;
						} catch {
							/* ignored: the next tick retries through play */
						}
					}
					play(stage.clip);
					return;
				}
				stage.clip.style.opacity = "0";
				if (stage.scrim) stage.scrim.style.opacity = "0";
				if (!stage.clip.paused) stage.clip.pause();
				stage.img.style.opacity = "1";
			};

			/**
			 * Whether a mutation happened inside the conversation area.
			 *
			 * This is the scope that separates "the model is writing" from "the user
			 * clicked something": menus, panels and toggles live outside the
			 * conversation node, so their churn no longer starts the animation.
			 * @param node - the mutation target.
			 * @returns whether the node belongs to the conversation.
			 */
			const insideConversation = (node) => {
				if (observed === null || !node) return false;
				if (typeof observed.contains !== "function") return false;
				return observed.contains(node);
			};

			/** Whether a turn looks alive right now. */
			const busy = () => {
				const now = Date.now();
				const hard = hasBusyMarker(doc);
				if (now < settleUntil) {
					stamps.length = 0;
					return { running: hard, reason: hard ? "marker" : "settle" };
				}
				while (stamps.length > 0 && now - stamps[0] > RATE_WINDOW_MS) stamps.shift();
				if (stamps.length >= RATE_MIN_MUTATIONS) lastActiveAt = now;
				if (hard) return { running: true, reason: "marker" };
				if (now - lastActiveAt < HOLD_MS) return { running: true, reason: "activity" };
				return { running: false, reason: "quiet" };
			};

			/** Reconcile the stage with the shell state. */
			const reconcile = () => {
				const video = findBackgroundVideo(doc);
				if (video === null) {
					if (source !== null || stage !== null) {
						removeStage();
						source = null;
					}
					return;
				}
				const rebuilt = video !== source || stage === null || !stage.node.isConnected;
				if (rebuilt) {
					// Build first, then hide: buildStage() runs removeStage(), and that
					// restores the previous source's visibility — hiding before it would be
					// undone immediately (measured).
					buildStage(video);
					source = video;
					// The skin's own element keeps painting otherwise; it is the thing that
					// showed the wrong (blank) frame, and it costs CPU while hidden.
					video.style.visibility = "hidden";
					if (!video.paused) video.pause();
					lastBusy = null;
				}
				const decision = busy();
				const fresh = decision.running !== lastBusy;
				lastBusy = decision.running;
				if (fresh) {
					console.debug("[bg-motion]", decision.running ? "running" : "idle", "via", decision.reason);
				}
				paint(decision.running, fresh);
			};

			/** Reset the rate window when the conversation is replaced. */
			const retarget = () => {
				const target = findConversation(doc);
				if (target === observed) return;
				observed = target;
				stamps = [];
				settleUntil = Date.now() + SETTLE_MS;
			};

			const start = () => {
				const view = doc.defaultView;
				const Observer = view && view.MutationObserver;
				settleUntil = Date.now() + SETTLE_MS;
				if (typeof Observer === "function") {
					observer = new Observer((records) => {
						const now = Date.now();
						let counted = 0;
						for (let i = 0; i < records.length; i += 1) {
							const target = records[i].target;
							// Only the conversation is evidence of output. Counting the whole
							// document made every unrelated click (menus, panels, toggles)
							// start the animation, because opening a popover easily produces
							// three mutations.
							if (!insideConversation(target)) continue;
							if (insideComposer(target)) continue;
							stamps.push(now);
							counted += 1;
						}
						if (stamps.length > 64) stamps = stamps.slice(-64);
						if (counted > 0 || records.length > 0) reconcile();
					});
					observer.observe(body, { subtree: true, childList: true, characterData: true });
				}
				retarget();
				reconcile();
				if (view && typeof view.setInterval === "function") {
					ticker = view.setInterval(() => {
						retarget();
						reconcile();
					}, TICK_MS);
				}
				return () => {
					if (observer !== null) observer.disconnect();
					if (ticker !== null && view && typeof view.clearInterval === "function") view.clearInterval(ticker);
					removeStage();
					observer = null;
					ticker = null;
					observed = null;
					source = null;
					lastBusy = null;
				};
			};

			return start;
		}

		const inject = [];

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
