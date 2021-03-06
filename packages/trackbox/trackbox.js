// Run when shell is loaded
tb.onShellLoaded(function () {
	// REST OF INTERFACE //

	// Disable selection with Ctrl + A
	$(function () {
		$(document).keydown(function (event) {
			// Get the target element of the keydown event
			var target = event.target || event.srcElement;

			// Ensure the target is not typing inside a textbox
			if (target.tagName !== "textarea" && target.type !== "text") {
				if (event.ctrlKey) {
					if (event.keyCode === 65 || event.keyCode === 97) {
						return false;
					}
				}
			}
		});
	});

	// Clear search bar
	$("#search-bar > div > a").click(function () {
		$("#search-bar > div > input").val("");
	});
	$("#search-bar > div > input").keydown(function (key) {
		// Usually doesn't work in Firefox for some reason
		if (key.keyCode === 27) {
			$("#search-bar > div > input").val("");
		}
	});

	var pauseKeyDown = false;

	/*** SCRUBBER MOVEMENT ***/

	// Determines if the scrubber gets updated with the current music time
	var updateScrubber = false;

	// Add the mouse down listener to check when the mouse clicks down on it
	$("#timeline-bar-sensor")[0].addEventListener("mousedown", scrubMouseDownListener);

	// Drag: Mouse down
	function scrubMouseDownListener(evt) {

		// Disable text selection while dragging
		evt.preventDefault();

		// Stop the scrubber from moving from playback
		updateScrubber = false;

		// Add listener for mouse down
		window.addEventListener("mouseup", scrubMouseUpListener);

		// Bind and call the move listener
		document.addEventListener("mousemove", scrubMouseDownListener);
		scrubMouseMoveListener(evt);
	}

	// Drag: Mouse up
	function scrubMouseUpListener() {

		// Re-enable the scrubber's movement from playback
		updateScrubber = true;

		// Remove the mouse up and mouse move listeners
		window.removeEventListener("mouseup", scrubMouseUpListener);
		document.removeEventListener("mousemove", scrubMouseDownListener);

		// Get slider position
		var timePercent = $("#timeline-bar-sensor .slider-knob")[0].style.left.substring(0, $("#timeline-bar-sensor .slider-knob")[0].style.left.length - 1) / 100;

		// Set the new track time
		tb.setCurrentTime(timePercent * tb.getLength());
	}

	// Drag: Mouse movement
	function scrubMouseMoveListener(evt) {

		// Get mouse movement
		var percentage = (evt.clientX / document.body.clientWidth) * 100;

		// Constrain movement inside timeline
		if (percentage < 0) {
			percentage = 0;
		} else if (percentage > 100) {
			percentage = 100;
		}

		// Set slider position
		$("#timeline-bar-sensor .slider-knob").css("left", percentage + "%");
		$("#timeline-bar").css("width", percentage + "%");
	}

	// Update scrubber position with music time
	function scrubberUpdater() {
		// Only update scrubber if updateScrubber is enabled
		if (updateScrubber) {
			// Get the percentage from the time over the total time
			var percentage = tb.getCurrentTime() / tb.getLength() * 100;

			// Limit the length to a max of 100%
			if (percentage > 100) {
				percentage = 100;
			}

			// Update the slider in the DOM with the percent
			$("#timeline-bar-sensor .slider-knob").css("left", percentage + "%");
			$("#timeline-bar").css("width", percentage + "%");
			$("#song-time").html(tb.formatTime(Math.floor(tb.getCurrentTime())) + " / " + tb.formatTime(Math.round(tb.getLength())));
		}

		// Call the function again next time the page is repainted
		requestAnimationFrame(scrubberUpdater);
	}

	// Call the scrubber updater
	scrubberUpdater();

	/*** PLAYBACK BAR ***/

	// Get and display track information
	tb.onTrackLoad(function () {
		// Get the metadata for the current track
		var metadata = tb.getCurrentTrack();

		// Add the title, album, and artist
		$("#current-track-title").html(metadata.title);
		$("#current-track-album").html(metadata.album);
		$("#current-track-artist").html(metadata.artists[0]);

		// Add the album art image
		$("<img src='" + metadata.artwork + "' />").appendTo($("#playback-art").html(""));

		if ($("#playback").hasClass("hidden")) {
			// Make the playback bar visible
			$("#playback").removeClass("hidden");

			// Make the scrubber update while it's visible
			updateScrubber = true;
		}
	});

	// Hide the playback bar when the track is unloaded
	tb.onTrackUnload(function () {
		// Hide the playback bar
		$("#playback").addClass("hidden");

		// Stop updating the scrubber while it's not shown
		updateScrubber = false;
	});

	// Right click on the playback button to close the track
	$(document).on("mousedown", "#playback-play-pause", function (event) {
		// Check for right click, event 3
		if (event.which === 3) {
			// Unload the track
			tb.setCurrentTrack();
		}
	});

	// Play/Pause button click
	$("#playback-play-pause").click(function () {
		tb.togglePlayPause();
	});

	// Change Play/Pause button to Pause when the music is playing
	tb.onPlay(function () {
		$("#playback-play-pause #play").hide();
		$("#playback-play-pause #pause").show();
		$("#playback-play-pause").attr("title", tb.getTranslation("Pause"));
	});

	// Change Play/Pause button to Play when the music is paused
	tb.onPause(function () {
		$("#playback-play-pause #pause").hide();
		$("#playback-play-pause #play").show();
		$("#playback-play-pause").attr("title", tb.getTranslation("Play"));
	});

	// Spacebar pause
	$("body").keydown(function (event) {
		// Check if the key is the spacebar
		if (event.keyCode === 32) {
			// Get the target element of the keydown event
			var target = event.target || event.srcElement;

			// Ensure the target is not typing inside a textbox
			if (target.tagName !== "textarea" && target.type !== "text") {
				// Ensure the pause key is not already held down (if so, this would be a refiring of the event because it's held down)
				if (!pauseKeyDown) {
					// The pause key is now down, so mark it as such to ensure it can't toggle multiple times while being held down
					pauseKeyDown = true;

					// Toggle pause/play
					tb.togglePlayPause();
				}
			}
		}
	}).keyup(function (event) {
		// Release spacebar
		if (event.keyCode === 32 && pauseKeyDown) {
			// Mark the pause key as up again
			pauseKeyDown = false;
		}
	});

	// Volume slider mouse down
	$("#volume-control")[0].addEventListener("mousedown", volumeMouseDownListener);
	function volumeMouseDownListener(event) {
		window.addEventListener("mouseup", volumeMouseUpListener);

		// Bind and call the move listener
		document.addEventListener("mousemove", volumeMouseDownListener);
		volumeMouseMoveListener(event);
	}

	// Volume slider mouse up
	function volumeMouseUpListener() {
		window.removeEventListener("mouseup", volumeMouseUpListener);
		document.removeEventListener("mousemove", volumeMouseDownListener);
	}

	// Volume slider mouse movement
	function volumeMouseMoveListener(evt) {
		// Get mouse movement
		var percentage = ((evt.clientX - $("#volume-control .knob").offset().left) / $("#volume-control .knob").width() * 100);

		// Constrain movement inside timeline
		if (percentage < 0) { percentage = 0; }
		if (percentage > 100) { percentage = 100; }

		// Set playback volume
		tb.setVolume(percentage / 100);

		// Set slider position
		$("#volume-control .knob > div").css("left", percentage + "%");
		$("#volume-control .track > div > div:first-child > div").css("width", percentage + "%");

		// Hide speaker icon sound waves
		if (tb.getVolume() * 100 < 66) { $("#volume-control svg path:nth-child(1)").hide(); } else { $("#volume-control svg path:nth-child(1)").show(); }
		if (tb.getVolume() * 100 < 33) { $("#volume-control svg path:nth-child(2)").hide(); } else { $("#volume-control svg path:nth-child(2)").show(); }
		if (tb.getVolume() * 100 === 0) { $("#volume-control svg path:nth-child(3)").hide(); } else { $("#volume-control svg path:nth-child(3)").show(); }
	}

	// Playback Order buttons
	playbackOrderWrap(0);
	function playbackOrderWrap(index) {
		$("#playback-order a").removeClass("playback-order-active");
		$("#playback-order a:eq(" + index + ")").addClass("playback-order-active");

		// Reset wrappers
		$("div[class^='playback-order-before-'] > a, div[class*=' playback-order-before-'] > a").unwrap();
		$("div[class^='playback-order-after-'] > a, div[class*=' playback-order-before-'] > a").unwrap();
		$(".playback-order-current > a").unwrap();

		// Add wrappers
		if (index > 0) {
			$("#playback-order > a:nth-child(-n+" + index + ")").wrapAll('<div class="playback-order-before-' + index + '"></div>');
		}
		$("#playback-order > a:eq(0)").wrapAll('<div class="playback-order-current"></div>');
		if ($("#playback-order > a").length > 0) {
			$("#playback-order > a").wrapAll('<div class="playback-order-after-' + $("#playback-order > a").length + '"></div>');
		}
	}

	// Click on a Playback Order button
	$("#playback-order a").click(function () {
		playbackOrderWrap($("#playback-order a").index(this));
	});

	// Add page tabs
	function addPageTabs() {
		tb.onPackagesLoaded(function () {
			tb.getPackages({ "type": "page" }, false, function (pages) {
				tb.getPackageLocation("trackbox/trackbox", function (location) {
					tb.getFileContents(location + "/templates/page-button.html", function (template) {
						$("#page-tabs").html("");
						Object.keys(pages).forEach(function (page) {
							tb.getFileContents(pages[page].location + "/" + pages[page].pageIcon, function (icon) {
								var renderedTemplate = tb.render(template, {
									"URL": pages[page].preferredUrl,
									"REPO": pages[page].repo.replace("/", ":"),
									"NAME": tb.getTranslation(pages[page].pageName),
									"ICON": icon
								});
								$("#page-tabs").append(renderedTemplate);
								if (tb.getCurrentPageUrl() === pages[page].url || pages[page].standardUrl.indexOf(tb.getCurrentPageUrl()) !== -1) {
									selectPageTab(pages[page].repo);
								}
							});
						});
					});
				});
			});
		});
	}

	// Call for page tabs to be added
	if (tb.isPackagesLoaded) {
		addPageTabs();
	} else {
		tb.onPackagesLoaded(function () {
			addPageTabs();
		});
	}

	// Call to select current page tab
	tb.onPageLoadInitiated(function (repo) {
		selectPageTab(repo);
	});

	// Mark active page tab as selected
	function selectPageTab(repo) {
		repo = repo.replace("/", "\\:");
		$("#page-tabs > a").removeClass("page-selector-active");
		$("#" + repo).addClass("page-selector-active");
	}

	// Window button functionality
	$("#window-buttons > a").eq(0).click(function () {
		require("remote").getCurrentWindow().minimize();
	});
	$("#window-buttons > a").eq(1).click(function () {
		require("remote").getCurrentWindow().maximize();
	});
	$("#window-buttons > a").eq(2).click(function () {
		require("remote").getCurrentWindow().unmaximize();
	});
	$("#window-buttons > a").eq(3).click(function () {
		require("remote").getCurrentWindow().close();
	});

	tb.onWindowMaximize(function () {
		$("#window-buttons > a").eq(1).hide();
		$("#window-buttons > a").eq(2).show();
		$("#wrapper").removeClass("border");
	});

	tb.onWindowUnmaximize(function () {
		$("#window-buttons > a").eq(1).show();
		$("#window-buttons > a").eq(2).hide();
		$("#wrapper").addClass("border");
	});

});