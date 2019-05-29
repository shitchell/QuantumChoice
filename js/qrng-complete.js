class QRNG
{
	_cache;
	_requestLocks;
	_types;
		
	constructor()
	{
		var cache = {};
		var requestLocks = {};
		
		this._types = ['uint8', 'uint16', 'hex16'];
		this._types.forEach(function(el)
		{
			cache[el] = [];
			requestLocks[el] = false;
		})
		this._cache = cache;
		this._requestLocks = requestLocks;
		this._fillCache(100);
	}

	_fillCache(length, type, wait, blocks)
	{
		var cache = this._cache;
		var requestLocks = this._requestLocks;
		var type = type;

		if (typeof type === "undefined")
		{
			var type = "uint16";
		}
		
		if (!type in this._types)
		{
			return;
		}
		
		if (requestLocks[type])
		{
			return;
		}
		
		if (typeof length !== "number")
		{
			var length = 50;
		}

		if (typeof blocks !== "number")
		{
			var blocks = 2;
		}
		
		let url = `https://qrng.anu.edu.au/API/jsonI.php?length=${length}&type=${type}&size=${blocks}`;
		let xhr = new XMLHttpRequest();
		xhr.open("GET", url, !wait);
		xhr.onload = function(e)
		{
			console.log(xhr.responseText);
			let response = JSON.parse(xhr.responseText);

			// Check that ANU validated our query
			if (!response.success)
			{
				throw "Invalid query";
			}
			let data = response.data;
			
			// Prepend the new values to the appropriate cache
			console.log("this. is.", this);
			cache[type] = data.concat(cache[type]);
		}
		xhr.onreadystatechange = function(e)
		{
			requestLocks[type] = false;
		}
		xhr.onerror = function(e)
		{
			throw "Error loading url";
		}
		if (!wait)
		{
			xhr.timeout = function(e)
			{
				throw "Request timed out";
			}
		}
		
		console.log("Requesting URL", url);
		requestLocks[type] = true;
		xhr.send();
	}

	_getRandom(type, blocks)
	{
		if (typeof type === "undefined")
		{
			type = "uint16";
		}
		
		if (! type in this._cache)
		{
			return false;
		}

		// If we have less than 0 numbers in the cache, wait for a refill
		if (this._cache[type].length <= 0)
		{
			console.log("waiting");
			this._fillCache(100, type, true, blocks);
		}
		// If we have less than 50, refill in the background
		else if (this._cache[type].length < 50)
		{
			this._fillCache(50, type, false, blocks);
		}

		return this._cache[type].pop();
	}

	_numToRange(min, max, num)
	{
		if (typeof min !== "undefined" && typeof max !== "undefined")
		{
			if (num < min || num >= max)
			{
				let range = max - min;
				num = num % range;
				num = min + num;
			}
		}

		return num;
	}

	getInteger(min, max)
	{
		let int = this._getRandom();

		return this._numToRange(min, max, int);
	}

	getHexadecimal(min, max)
	{
		let hex = this._getRandom('hex16');

		return hex;
	}
}