// User options
var CLIENT_PROGRESS = true; // if true get progress from javascript, otherwise get progress from nginx module
var MAX_FILESIZE = "5M";
var LEAVE_PAGE_TIMEOUT = 3; // Wait n seconds after upload complete.
var BATCH_ID_POST = true;   // Send batch_id to redirected url (for back-end)
var BATCH_ID_SS   = true;   // Save batch_id to sessionStorate before redirect (for front-end)

// Global constants
var LISTED_LANG = ["zh-tw"];
var MAX_FILESIZE_BYTES = 0;
var TERMS = null;

// Global resources
var xhr2 = new XMLHttpRequest();
var abort_flag = false;
var upload_files = null;

$(document).ready(function() {
	loadLanguage();

	// Step 1
	var nullHandler = function(e) { e.preventDefault(); return false; };
	$(window).on("dragover", nullHandler);
	$(window).on("drop", nullHandler);
	$("#drop_area").on("dragover", nullHandler);

	// Drag & Drop
	$("#drop_area").on("dragenter", function(e) {
		e.preventDefault();
		$(this).addClass("add_files");
	});
	$("#drop_area").on("dragleave", function(e) {
		e.preventDefault();
		$(this).removeClass("add_files");
	});
	$("#drop_area").on("drop", function(e) {
		e.preventDefault();
		$(this).removeClass("add_files");
		upload_files = e.dataTransfer.files;
		listFiles();
	});

	// Click button
	$("#queue_list > .prompt > .step1 button[term=open]").click(function() {
		$("#file_list").trigger("click");
	});
	$("#file_list").on("change", function() {
		upload_files = $("#file_list")[0].files;
		listFiles();
	});

	// Step 2
	$("#queue_list > .prompt > .step2 > .sure").click(startUpload);
	$("#queue_list > .prompt > .step2 > .cancel").click(function() {
		$("#queue_list > .item").remove();
		$("#queue_list > .prompt > .step2").hide();
		$("#queue_list > .prompt > .step1").show();
	});

	// Step 3
	$("#queue_list > .prompt > .step3 > .abort").click(function() {
		abort_flag = true;
		xhr2.abort();
		$("#queue_list > .prompt > .step3").hide();
		$("#queue_list > .prompt > .step5").show();
	});
});

var loadLanguage = function() {
	//-------------------------------------
	// console.log(navigator.language);
	// console.log(navigator.userLanguage);
	//-------------------------------------
	//  Chrome 37: zh-TW / undefined
	// Firefox 32: zh-TW / undefined
	// Safari 7.1: zh-tw / undefined
	//      IE 11: zh-TW / zh_TW
	//-------------------------------------

	var lang = navigator.language.toLowerCase();
	if (LISTED_LANG.indexOf(lang)>-1) {
		var url = "i18n/" + lang + ".json";
		$.getJSON(url, function(terms) {
			document.title = terms["title"];
			for (key in terms) {
				var term = terms[key];
				var q = "[term={KEY}]".replace("{KEY}",key);
				$(q).text(term);
			}
			TERMS = terms;
		});
	}
};

var listFiles = function() {
	if (upload_files.length>0) {
		var i;

		for (i=0;i<upload_files.length;i++) {
			var f = upload_files[i];
			var item = $("#hidden_elements > .item").clone();
			var status;

			if (!isLargeThenLimit(f.size)) {
				status = (TERMS!=null) ? TERMS["ready"] : "Ready";
			} else {
				status = (TERMS!=null) ? TERMS["exceed"] : "Exceed {MAX_FILESIZE}";
				status = status.replace("{MAX_FILESIZE}", MAX_FILESIZE);
				item.children("div").eq(2).children("span").removeClass("ignore");
				item.children("div").eq(2).children("span").addClass("error");
			}

			item.insertBefore("#queue_list > .prompt");
			item.children("div").eq(0).text(f.name);
			item.children("div").eq(1).text(properSize(f.size));
			item.children("div").eq(2).children("span").text(status);
		}

		$("#queue_list > .prompt > .step1").hide();
		$("#queue_list > .prompt > .step2").show();
	}
};

var startUpload = function() {
	var f, i, next_pos;
	var batch_id = generateUUID();
	var complete_form = document.forms["complete_req"];

	// read the page to redirect after uploading
	if (sessionStorage["upload_suite_redirect_url"]!=undefined) {
		complete_form.action = sessionStorage["upload_suite_redirect_url"];
	} else {
		complete_form.action = "complete-be.php";
	}

	if (BATCH_ID_POST) $("#batch_id").val(batch_id);
	if (BATCH_ID_SS)   sessionStorage["upload_suite_batch_id"] = batch_id;

	var pending = (TERMS!=null) ? TERMS["pending"] : "Pending";
	for (i=0;i<upload_files.length;i++) {
		f = upload_files[i];
		if (!isLargeThenLimit(f.size)) {
			$(".item").eq(i).children("div").eq(2).children("span").text(pending);
		}
	}

	var nextStep = function() {
		if (abort_flag) {
			var target;
			var aborted = (TERMS!=null) ? TERMS["aborted"] : 'Aborted';
			while (i<upload_files.length) {
				f = upload_files[i];
				if (!isLargeThenLimit(f.size)) {
					target = $(".item").eq(i).children("div").eq(2);
					target.html("");
					$("<span></span>").text(aborted).addClass("error").appendTo(target);
				}
				i++;
			}
		} else {
			var prev_pos = next_pos;

			if (++i<upload_files.length) {
				// Upload next file.
				$("#progress_bar").val(0);
				$("#progress_text").text(0);

				f = upload_files[i];
				if (!isLargeThenLimit(f.size)) {
					next_pos = $(".item").eq(i).children("div").last();
					next_pos.html("");
					next_pos.append($("#progress_view"));
					uploadSingleFile(f, batch_id, nextStep);
				} else {
					nextStep();
				}
			} else {
				// Every file is uploaded.
				var leave_counter = LEAVE_PAGE_TIMEOUT;
				var updateTimer = function() {
					var comment = (TERMS!=null) ?
							TERMS['step4'] :
							"Everything has been uploaded.\nWait {SECONDS} seconds for next step.";
					comment = comment.replace("{SECONDS}", leave_counter);
					comment = comment.replace("\n", "<br/>");
					$("span[term=step4]").html(comment);
				};

				updateTimer();
				leave_counter--;
				setInterval(function() {
					if (leave_counter==0) {
						complete_form.submit();
					} else {
						updateTimer();
						leave_counter--;
					}
				}, 1000);

				$("#queue_list > .prompt > .step3").hide();
				$("#queue_list > .prompt > .step4").show();
				$("#progress_view").appendTo("#hidden_elements");
			}

			var done = (TERMS!=null) ? TERMS["done"] : "Done";
			if (prev_pos.html()=="") prev_pos.html('<span class="good">'+done+'</span>');
		}
	};

	$("#queue_list > .prompt > .step2").hide();
	$("#queue_list > .prompt > .step3").show();

	i = 0;
	f = upload_files[i];
	next_pos = $(".item").eq(i).children("div").last();
	if (!isLargeThenLimit(f.size)) {
		next_pos.html("");
		next_pos.append($("#progress_view"));
		uploadSingleFile(f, batch_id, nextStep);
	} else {
		nextStep();
	}
};

var uploadSingleFile = function(f, batch_id, nextStep) {
	var formData = new FormData();
	formData.append("upload", f);
	formData.append("batch_id", batch_id);
	xhr2.open("post", "/upload-request", true);

	// Upload complete or error
	xhr2.onreadystatechange = function()  {
		if (xhr2.readyState==4) {
			switch(xhr2.status) {
				case 200:
					$("#progress_bar").val(100);
					$("#progress_text").text(100);
					break;
				default:
					$("#progress_bar").val(0);
					$("#progress_text").text(0);
			}

			if (!CLIENT_PROGRESS) {
				clearInterval(itv);
			}

			nextStep();
		}
	};

	// Client progress - HTML5 style (recommanded)
	if (CLIENT_PROGRESS) {
		xhr2.upload.onprogress = function(e) {
			var percentage = Math.floor(100*e.loaded/e.total); // IE
			$("#progress_bar").val(percentage);
			$("#progress_text").text(percentage);
		};
	}

	// Server progress - Nginx upload progress module
	if (!CLIENT_PROGRESS) {
		var uuid128 = generateUUID();

		// trace progress by UUID
		xhr2.setRequestHeader("X-Progress-ID", uuid128);
		var itv = setInterval(function() {
			$.ajax({
				url: "/upload-progress",
				type: "get",
				dataType: "json",
				headers: {"X-Progress-ID": uuid128},
				success: function(progress) {
					if (progress.state=="uploading") {
						var percentage = Math.floor(100*progress.received/progress.size);
						$("#progress_bar").val(percentage);
						$("#progress_text").text(percentage);
					} else {
						if (window.console!=undefined) {
							console.error(progress.state);
						}
					}
				}
			});
		}, 500);
	}

	// Send upload request
	xhr2.send(formData);
};

var isLargeThenLimit = function(filesize) {
	if (MAX_FILESIZE_BYTES==0) {
		var size_unit = MAX_FILESIZE.substr(-1);
		MAX_FILESIZE_BYTES = parseInt(MAX_FILESIZE);
		switch (size_unit) {
			case 'G':
				MAX_FILESIZE_BYTES *= 1024;
			case 'M':
				MAX_FILESIZE_BYTES *= 1024;
			case 'K':
				MAX_FILESIZE_BYTES *= 1024;
		}
	}

	return (filesize>MAX_FILESIZE_BYTES);
};

var properSize = function(filesize) {
	var unit_ptr = 0;
	var units = ['Bytes', 'KB', 'MB', 'GB'];

	while(filesize>=1024 && unit_ptr+1<units.length) {
		filesize = filesize/1024;
		unit_ptr++;
	}

	filesize += "";
	var dotpos = filesize.indexOf(".");
	if (dotpos!=-1) {
		filesize = filesize.substring(0,dotpos+3);
	}

	return filesize + " " + units[unit_ptr];
};

var generateUUID = function() {
	var i;
	var uuid128 = "";
	for(i=0;i<8;i++) {
		uuid128 += Math.floor((1+Math.random())*0x10000).toString(16).substring(1);
		if ([1,2,3,4].indexOf(i)>-1) uuid128 += "-";
	}

	return uuid128;
};