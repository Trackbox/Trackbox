// Load JSON preferences file.
tb.loadPreferences = function (forceReload) {
	if (!tb.private.preferences || forceReload) {
		tb.getJSONFileContents("users/default/preferences.json", function (data) {
			tb.private.preferences = data;
			tb.triggerOnPreferencesLoaded();
		});
	}
};

tb.preferences = function () {
	return tb.cloneObject(tb.private.preferences);
};

tb.triggerOnPreferencesLoaded = function () {
	$.event.trigger("onPreferencesLoaded");
};

tb.onPreferencesLoaded = function (callback) {
	$(window).on("onPreferencesLoaded", function () {
		callback();
	});
};
