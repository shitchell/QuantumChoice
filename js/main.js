const rng = new QRNG(20480);
const loadingTimeout = 5; // after 5 seconds, update the user that we're loading qrn's
var rcgOldSize;
const morphSpeed = 100;
const morphChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -',." +
                   "ΨΩαβγδεζηθικλμνξοπρστυφχфхцчГДЁЖЗЙКЛΦΛΘΔэю";
const magicAnswers = [
    "It is certain.",              // Yes
    "It is decidedly so.",         // Yes
    "Without a doubt.",            // Yes
    "Yes - definitely.",           // Yes
    "You may rely on it.",         // Yes
    "As I see it, yes.",           // Yes
    "Most likely.",                // Yes
    "Outlook good.",               // Yes
    "Yes.",                        // Yes
    "Signs point to yes.",         // Yes
    "Reply hazy, try again.",      // No answer
    "Ask again later.",            // No answer
    "Better not tell you now.",    // No answer
    "Cannot predict now.",         // No answer
    "Concentrate and ask again.",  // No answer
    "Don't count on it.",          // No
    "My reply is no.",             // No
    "My sources say no.",          // No
    "Outlook not so good.",        // No
    "Very doubtful."               // No
];

$(window).load(function() {
	rcgOldSize = $(".tabs-content").innerHeight();
});

$(document).ready(function() {
	// Replace Math.random with QRNG.getFloat
	// QRNG.replaceMath(); // Disabled - too many API calls for particles

	// Set the background to fullscreen
	$("#toggle-fs").click(function(e) {
		e.preventDefault();
		var el = document.getElementById("particles-js");
		req = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen;
		req.call(el);
	});

	// Toggle light/dark theme
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

	// Initialize all modals
	$(".modal").modal();

	// Initialize tabs
	$(".tabs").tabs({
		swipeable: true,
		responsiveThreshold: 1920,
		duration: 150
	});

	// RNG Form
	$("#rng-form").submit(function(e) {
		e.preventDefault();
		
		let rngMinimum = parseInt($("#rng-min").val()) || 0;
		let rngMaximum = parseInt($("#rng-max").val()) || 1000;
		let randomNumber = rng.getInteger(rngMinimum, rngMaximum + 1);

		$("#rng-result").html(randomNumber.toLocaleString());
		console.log("rng-form: ", randomNumber);
	});

	// RCG Form
	$("#rcg-form").submit(function(e) {
		e.preventDefault();

		var choiceText = $("#rcg-input").val();
		addChoice(choiceText);
	});

	// RCG - Choose an option
	$("#rcg-choose-button").click(function(e) {
		$(".rcg-picked").removeClass("rcg-picked z-depth-2"); // clear the last picked item
		var choice = rng.getChoice($("#rcg-choices").children());
		$(choice).addClass("rcg-picked z-depth-2");
	});

	// RCG - Clear all options
	$("#rcg-clear-button").click(function(e) {
		$("#rcg-choices").html("");
		$(".tabs-content").height(rcgOldSize);
	});

	// 8-Ball
	$("#eight-ball-button").click(function(e) {
		e.preventDefault();

		let answer = rng.getChoice(magicAnswers);
		morphifyText($("#eight-ball-result"), answer);
	});

	rng.onCacheEmpty = function() {
		$(".qrng").prop("disabled", true);
		console.log("rng.onCacheEmpty()");
	}

	rng.onReady = function() {
		$(".qrng").prop("disabled", false);
		console.log("rng.onReady()");
	}

	// Disable all qrng dependent buttons until loaded
	if (!rng.isReady())
	{
		console.log("rng is not ready, disabling");
		$(".qrng").prop("disabled", true);
	}

	// If qrng takes longer than loadingTimeout seconds to load, display a message
	setTimeout(function() {
		if (!rng.isReady())
		{
			M.toast({html: "Quantum flux hyperdrives reloading..."});
			var oldIsReady = rng.onReady;
			rng.onReady = function() {
				oldIsReady();
				M.toast({html: "Quantum randomness acheived!"});
			}
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

function morphifyText(el, text, indices, morphText) {
	// Generate an associative array of each index with a value of 3 if indices is undefined
	if (typeof indices === "undefined")
	{
		indices = {};
		for (i = 0; i < text.length; i++)
		{
			indices[i] = rng.getInteger(1, 5);
		}
	}

	// Generate random text matching the length of the text
	if (typeof morphText === "undefined")
	{
		morphText = "";
		for (i = 0; i < text.length; i++)
		{
			morphText += rng.getChoice(morphChars);
		}
	}

	var indicesKeys = Object.keys(indices);
	var indexNum = rng.getInteger(1, 4);
	var indexNum = (indexNum > indicesKeys.length) ? indicesKeys.length : indexNum;

	if (indexNum > 0)
	{
		for (i = 0; i < indexNum; i++)
		{
			let indexIndex = rng.getInteger(0, indicesKeys.length);
			let index = parseInt(indicesKeys.splice(indexIndex, 1)[0]);
			indices[index] -= 1;
			var newChar;
			
			// If we hit 0 for this index, make this char the correct value
			if (indices[index] <= 0)
			{
				newChar = text[index];
				delete indices[index];
			}
			else
			{
				newChar = rng.getChoice(morphChars);
				if (newChar === text[index])
				{
					// If we randomly got the right choice, stop altering this text
					delete indices[index];
				}
			}
			
			morphText = replaceChar(morphText, index, newChar);
		}

		$(el).html(morphText);
		
		if (Object.keys(indices).length > 0)
		{
			setTimeout(function() {
				morphifyText(el, text, indices, morphText);
			}, morphSpeed);
		}
	}

	$(el).html(morphText);
}

function replaceChar(string, index, char)
{
	if (index >= string.length)
	{
		return string;
	}
	return string.substring(0, index) + char + string.substring(index + 1);
}
