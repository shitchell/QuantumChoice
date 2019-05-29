var rng = new QRNG();
var loadingTimeout = 5; // after 5 seconds, update the user that we're loading qrn's
var rcgOldSize;

$(window).load(function() {
	rcgOldSize = $(".tabs-content").innerHeight();
});

$(document).ready(function() {
	// Replace Math.random with QRNG.getFloat
	QRNG.replaceMath();

	$("#toggle-fs").click(function(e) {
		e.preventDefault();
		var el = document.getElementById("particles-js");
		req = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen;
		req.call(el);
	});

	$("#theme-toggle").click(function(e) {
		e.preventDefault();

		var current = $("#theme-toggle").html();
		
		if (current === "dark")
		{
			pJSDom[0].pJS.particles.line_linked.color_rgb_line = {r: 0, g: 0, b: 255};
			$("#theme-toggle").html("light");
		}
		else
		{
			pJSDom[0].pJS.particles.line_linked.color_rgb_line = {r: 255, g: 255, b: 255};
			$("#theme-toggle").html("dark");
		}
		$("#particles-js").toggleClass("dark");
		$("main").toggleClass("dark");
		$("footer a").toggleClass("dark");
	});
	
	$(".modal").modal();
	
	$(".tabs").tabs({
		swipeable: true,
		responsiveThreshold: 1920,
		duration: 150
	});

	$("#rng-form").submit(function(e) {
		e.preventDefault();
		
		var rngMinimum = parseInt($("#rng-min").val()) || 0;
		var rngMaximum = parseInt($("#rng-max").val()) || 1000;
		
		var randomNumber = rng.getInteger(rngMinimum, rngMaximum + 1);
		$("#rng-result").html(randomNumber.toLocaleString());
		console.log("rng-form: ", randomNumber);
	});

	$("#rcg-form").submit(function(e) {
		e.preventDefault();

		var choiceText = $("#rcg-input").val();
		addChoice(choiceText);
	});

	$("#rcg-choose-button").click(function(e) {
		$(".rcg-picked").removeClass("rcg-picked z-depth-2"); // clear the last picked item
		var choiceElements = $("#rcg-choices").children();
		var choice = rng.getInteger(0, choiceElements.length);
		$(choiceElements[choice]).addClass("rcg-picked z-depth-2");
	});

	$("#rcg-clear-button").click(function(e) {
		$("#rcg-choices").html("");
		$(".tabs-content").height(rcgOldSize);
	})

	rng.onCacheEmpty = function() {
		$(".qrng").prop("disabled", true);
		console.log("rng.onCacheEmpty()");
	}

	rng.onReady = function() {
		$(".qrng").prop("disabled", false);
		console.log("rng.onReady()");
	}

	if (!rng.isReady())
	{
		$(".qrng").prop("disabled", true);
	}

	setTimeout(function() {
		if (!rng.isReady())
		{
			M.toast({html: "Attempting to load quantumness..."});
		}
	}, loadingTimeout * 1000);
});

function addChoice(choiceText)
{
	if (choiceText !== "")
	{
		var chip = $("<div/>").addClass("chip");
		var icon = $("<i/>").addClass("close material-icons");
		$(icon).html("close");
		$(chip).append(choiceText).append(icon);

		$("#rcg-choices").append(chip);
		$("#rcg-input").val("");

		let testSize = $("#rcg-choices").innerHeight() + 160;
		if (testSize < rcgOldSize)
		{
			testSize = rcgOldSize;
		}
		$(".tabs-content").height(testSize);
		
		console.log("rcg-form: added '" + choiceText + "'");
	}
}