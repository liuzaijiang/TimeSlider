(function () {
	if (typeof jQuery === 'undefined') {
		throw new Error('Slider\'s JavaScript requires jQuery')
	}

	//让bind函数支持IE8
	if (!Function.prototype.bind) {
		Function.prototype.bind = function (oThis) {
			if (typeof this !== "function") {
				throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
			}
			var aArgs = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			fNOP = function () {},
			fBound = function () {
				return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
					aArgs.concat(Array.prototype.slice.call(arguments)));
			};
			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();
			return fBound;
		};
	}

	/*单例模式*/
	var getInstance = function () {
		var res = {};       
		return function (fn) {
			if (res[fn]) {
				return res[fn]
			}
			res[fn] = fn.call(this, arguments)
			return res[fn];
		}
	}()


	var defalutColor = ["007acc", 'a5df12', 'eaaae4', '04d4d4', 'd32311'];
	/*为事件BOX添加颜色*/
	(function () {
		_.forEach($(".eventBox"), function (item, index) {
			$(item).css("backgroundColor", "#" + defalutColor[index])
		})
	})()

	//将颜色从rgb转换为16进制格式
	function rgbToHex(rgb) {
		var _rgb = rgb.match(/[^\(\)]+(?=\))/g)[0].split(",");
		if (_rgb) {
			var hex = "";
			_.forEach(_rgb, function (item) {
				hex += ("0" + parseInt(item).toString(16)).slice(-2);
			})
			return (hex);
		}
	}

    function createCoverDiv() {
		var fixedDiv = document.createElement("div");
		$(fixedDiv).addClass("fixBGDiv").attr("id", "fixedDiv")
        $("body").append(fixedDiv)
		return "createCoverDivCall";
	}
    
	function createPopUpBox() {
     /* 利用_.template 模板引擎来渲染 */
     var popUpBoxString='\
       <div class="modal" id="modalDiv" data-number="">\
         <div class="modal-dialog">\
             <div class="modal-content">\
                <div class="modal-header">\
                    <h4 class="modal-title"><%=modalHeaderTitile%></h4>\
                </div>\
                <div class="modal-body">\
                  <div class="time-div">\
                    <div class="time-start-div">\
                       <label class="time-lab"><%=timeStartLab%></label>\
                       <input type="text" maxlength="2" id="startH" class="time-input"> :\
                       <input type="text" maxlength="2" id="startM" class="time-input">\
                    </div>\
                    <div class="time-stop-div">\
                       <label class="time-lab"><%=timeStopLab%></label>\
                       <input type="text" maxlength="2" id="stopH" class="time-input"> :\
                       <input type="text" maxlength="2" id="stopM" class="time-input">\
                    </div>\
                  </div>\
                  <div class="event-div">\
                    <label class="event-lab"><%=eventLab%></label>\
                    <select class="event-select" id="eventSelect">\
                      <%_.forEach(eventArray,function(item,index){%>\
                        <option value=<%=index+1%>><%=item%></option>\
                      <%})%>\
                    </select>\
                  </div>\
                </div>\
                <div class="modal-footer">\
                  <button class="btn" id="setBtn"><%=setBtnName%></button>\
                  <button class="btn" id="delBtn"><%=delBtnName%></button>\
                  <button class="btn" id="calBtn"><%=calBtnName%></button>\
                </div>\
             </div>\
         </div>\
       </div>'

       var lan=_gLanguage;
       var obj={
           'modalHeaderTitile':["Edit","编辑"][lan],
           'timeStartLab':["Start Time","开始时间"][lan],
           'timeStopLab':["Stop Time","结束时间"][lan],
           'eventLab':["Event Type","事件类型"][lan],
           'eventArray':[["Event1","事件1"][lan], ["Event2","事件2"][lan], ["Event3","事件3"][lan], ["Event4","事件4"][lan], ["Event5","事件5"][lan]],
           'setBtnName':["Set","设置"][lan],
           'delBtnName':["Delete","删除"][lan],
           'calBtnName':["Cancel","取消"][lan]
       }
        popUpBoxString=_.template(popUpBoxString);
        var dom=popUpBoxString(obj) 
        $("body").append(dom)

		/*绑定事件*/
		$("#setBtn").click(function () {
			var contextIndex = $("#modalDiv").attr("data-number") - 1;
			var self = _gContextArray[contextIndex];
			var STH = parseInt($("#startH").val());
			var STM = parseInt($("#startM").val());
			var SPH = parseInt($("#stopH").val());
			var SPM = parseInt($("#stopM").val());

			if ((STH).toString() == "" || (STM).toString() == "" || (SPH).toString() == "" || (SPM).toString() == "") {
				alert("请设置");
				return
			} else if (STH < 0 || STH > 23 || SPH < 0 || SPH > 24) {
				alert("小时请填写0-24之间的数字");
				return;
			} else if (STM < 0 || STM > 59 || SPM < 0 || SPM > 59) {
				alert("分钟请填写0-59之间的数字");
				return;
			} else if (SPH < STH || (SPH == 24 && SPM > 0)) {
				alert("请填写正确的时间");
				return;
			} else if ((STH == SPH) && (SPM < STM)) {
				alert("这个错得太离谱")
				return;
			} else if ((SPH * 60 + SPM) - (STH * 60 + STM) < 30) {
				alert("间隔至少30分钟");
				return;
			}
			var rightBarId = $("#" + self.dragId).children(".rightBar").attr("id");
			var rightShowId = $("#" + self.dragId).children(".rightShow").attr("id");
			var leftShowId = $("#" + self.dragId).children(".leftShow").attr("id");

			var newLeft = parseFloat((STH * self.oneHourWidth + STM * self.oneHourWidth / 60).toFixed(1));
			var newRight = parseFloat((SPH * self.oneHourWidth + SPM * self.oneHourWidth / 60).toFixed(1));
			var arrayLen;
			arrayLen = self.left_array.length;

			/*设置过程中判断时间段是否超出边界范围及超过其他时间段*/
			if (newLeft < 0 || newRight > $("#" + self.dragId).parent().width()) {
				alert("超过时间轴长度，请重新设置");
				return
			}
			if (arrayLen >= 2) {
				if (self.whichOne == 0) {
					if (newRight > self.left_array[self.whichOne + 1]) {
						alert("与其他时间段重合，请重新设置");
						return;
					}
				} else if (self.whichOne == arrayLen - 1) {
					if (newLeft < self.right_array[self.whichOne - 1]) {
						alert("与其他时间段重合，请重新设置");
						return;
					}
				} else {
					if (newLeft < self.right_array[self.whichOne - 1] || newRight > self.left_array[self.whichOne + 1]) {
						alert("与其他时间段重合，请重新设置");
						return;
					}
				}
			}
			self.left_array.splice(self.whichOne, 1, newLeft);
			self.right_array.splice(self.whichOne, 1, newRight);

			$("#" + self.dragId).css({
				"left" : newLeft,
				"width" : newRight - newLeft
			})

			$("#" + rightBarId).css({
				"left" : newRight - newLeft - $("#" + rightBarId).width() / 2
			})

			$("#" + rightShowId).css({
				"left" : newRight - newLeft
			})

			var textSTH = STH > 10 ? STH : "0" + STH;
			var textSTM = STM > 10 ? STM : "0" + STM;
			var textSPH = SPH > 10 ? SPH : "0" + SPH;
			var textSPM = SPM > 10 ? SPM : "0" + SPM;

			self.setSliderTime(newLeft, leftShowId);
			self.setSliderTime(newRight, rightShowId);

			/*更新时间数组里面的时间*/
			self.leftTime_array.splice(self.whichOne, 1, self.leftTime);
			self.rightTime_array.splice(self.whichOne, 1, self.rightTime);

            /*更新事件*/
			$("#" + self.dragId).css("backgroundColor", "#" + defalutColor[$("#eventSelect").val() - 1]);
            self.events_array.splice(self.whichOne, 1, $("#eventSelect").val() - 1);    
			$("#modalDiv").hide();
			$("#fixedDiv").hide();
		})

		$("#delBtn").click(function () {
			var contextIndex = $("#modalDiv").attr("data-number") - 1;
			var self = _gContextArray[contextIndex];
			self.right_array.splice(self.whichOne, 1);
			self.left_array.splice(self.whichOne, 1);
			self.leftTime_array.splice(self.whichOne, 1);
			self.rightTime_array.splice(self.whichOne, 1);
            self.events_array.splice(self.whichOne, 1);
			$("#" + self.dragId).remove();
			$("#modalDiv").hide();
			$("#fixedDiv").hide();
		})

		$("#calBtn").click(function () {
			$("#modalDiv").hide();
			$("#fixedDiv").hide();
		})
        return "createPopUpBoxCall";
	}
    
    function creatEditDiv(context){
        var editDivString='\
                <div class="editWrap" id=<%="editDiv"+context.timeSliderNum%>>\
                    <img src="images/edit.png" class="editImg"></img>\
                    <img src="images/del.gif" class="delImg"></img>\
                    <div class="editContent" id=<%="editContent"+context.timeSliderNum%>>\
                        <div class="editHeader">\
                            <label class="editHeaderTitle"><%=editHeaderTitle%></label>\
                        </div>\
                        <div class="editBody">\
                          <%_.forEach(editTextObj,function(item,index){%>\
                              <div class="editUnit">\
                                 <input class=<%="editCBox"+context.timeSliderNum%> id=<%="editCBox"+context.timeSliderNum+"_"+index%> type="checkbox"></input>\
                                 <label><%=item%></label>\
                              </div>\
                          <%})%>\
                               <div class="editUnit">\
                                  <input class="editCheckAll" type="checkbox"></input>\
                                  <label><%=checkAllName%></label>\
                               </div>\
                        </div>\
                        <div class="editFotter">\
                            <button class="editBtn save"><%=saveName%></button>\
                            <button class="editBtn cancel"><%=cancelName%></button>\
                        </div>\
                    </div>\
                </div>'
        
        var lan=_gLanguage;         
        var editTextObj = [
				["Mon","星期一"][lan],
				["Tue","星期二"][lan],
				["Wed","星期三"][lan],
				["Thurs","星期四"][lan],
				["Fri","星期五"][lan],
				["Sat","星期六"][lan],
				["Sun","星期日"][lan]
                ]
        var obj={
            'context':context,
            'editHeaderTitle':["Copy To","复制到"][lan],
            'editTextObj':editTextObj,
            'checkAllName':["Check All","全选"][lan],
            'saveName':["Save","保存"][lan],
            'cancelName':["Cancel","取消"][lan]
        }
        
        editDivString=_.template(editDivString);
        var dom=editDivString(obj);
        $("#" + context.mountId).after(dom);
        
        $("#editDiv"+context.timeSliderNum).click(function(e){
             if($(e.target).attr("class")=="editImg")
             {              
                 $(".editContent").hide();
                 $("#editCBox"+context.timeSliderNum+"_"+(context.timeSliderNum-1)).attr("disabled",true);
				 $("#editContent" + context.timeSliderNum).show();
             }
             else if($(e.target).attr("class")=="delImg")
             {
                 if (window.confirm(["Do you want to delete all time periods on this timeline?","是否要删除此时间轴上的所有时间段"][lan])) {
                        context.removeAll();
                 }
             }
             else if($(e.target).attr("class").substring(0,8)=="editCBox")
             {
                  $("#editDiv"+context.timeSliderNum+" .editCheckAll").prop("checked", $(".editCBox" + context.timeSliderNum).length == $(".editCBox" + context.timeSliderNum).filter(":checked").length-1);
             }
             else if($(e.target).attr("class")=="editBtn save")
             {          
                 context.copyTimeSlider(1);
                 $("#editContent" + context.timeSliderNum).hide();
             }
             else if($(e.target).attr("class")=="editBtn cancel")
             {
                  $("#editContent" + context.timeSliderNum).hide();
             }
             else if($(e.target).attr("class")=="editCheckAll")
             {
                 var state=$("#editDiv"+context.timeSliderNum+" .editCheckAll").prop("checked");       
                 $(".editCBox" + context.timeSliderNum).filter(function(index,item){  
                   if(!$(item).prop("disabled"))
                    {
                      $(item).prop("checked",state)
                    }
                 })
             }
         })
    }

	var _gContextArray = new Array(); //存放每个时间轴对象实例的上下文this的数组
    var _gLanguage=1; //0代表英文，1代表中文
	function TimeSlider(initObj) {
		this.left_array = new Array(); //存放每个拖块的左坐标
		this.right_array = new Array(); //存放每个拖块的右坐标
		this.leftTime_array = new Array(); //存放每个拖块的左坐标对应的时间
		this.rightTime_array = new Array(); //存放每个拖块的右坐标对应的时间
		this.events_array = new Array(); //存放每个时间轴的事件
		this.leftTime = 0; //存放当前操作拖块的时间
		this.rightTime = 0; //存放当前操作拖块的时间
		this.slderLeftOffset = 0; //时间轴距离左页面的距离
		this.oneDragBlockWidth = 0;
		this.oneHourWidth = 0;
		this.dragNum = 0; //拖块个数-1
		this.hasMove = false; //判断拖块是click事件还是move事件
		this.whichOne = 0; //目前操纵的拖块在坐标数组中的索引
		this.timeSliderNum = 0; //TimeSlider实例个数
		this.calTimeFlag = false; //是否计算时间
		this.dragId = null; //当前操作的拖块的ID
		this.mountId = null; //当前挂载的真实DOM的ID
		this.currentEvent = null; //当前操作拖块的事件

        _gLanguage=initObj.language=="en"?0:1;
		this.init(initObj); //初始化开始
	}

	TimeSlider.prototype = {
		sliderTotal : 0, //TimeSlider实例个数
		init : function (obj) {
			_gContextArray.push(this);
			TimeSlider.prototype.sliderTotal++;
			this.timeSliderNum = TimeSlider.prototype.sliderTotal;
			this.createLayout(obj);

		},

		/*创建整个时间轴的DOM结构*/
		createLayout : function (obj) {
			this.mountId = obj.id;
			this.events_array = obj.defaultEvents || [];
			var oneDragBlockTime = obj.oneDragBlockTime || 60; //每个拖块代表的时间
			var self = this; //保存当前上下文
			/*创建布局*/
			var backgroundDiv = document.createElement("div");
			$(backgroundDiv).addClass("trCanvas").appendTo("#" + this.mountId);

			var oneHourWidth = Math.floor($(backgroundDiv).width() / 24); //每一个小时占的宽度
			this.oneHourWidth = oneHourWidth;
			var oneDragBlockWidth = Math.floor(oneHourWidth * oneDragBlockTime / 60); //每个拖块的宽度
			this.oneDragBlockWidth = oneDragBlockWidth;

			for (var i = 0; i < 25; i++) {
				var coordinateDiv = document.createElement("div");
				$(coordinateDiv).addClass("coordinate").css({
					"left" : oneHourWidth * i + "px"
				}).appendTo("#" + this.mountId);

				var labelDiv = document.createElement("div");
				if (i < 10) {
					$(labelDiv).addClass("coordinateLabDiv").text(i).css({
						"left" : oneHourWidth * i + "px"
					}).appendTo("#" + this.mountId);
				} else {
					$(labelDiv).addClass("coordinateLabDiv").text(i).css({
						"left" : oneHourWidth * i + "px",
						"margin-left" : "-6px"
					}).appendTo("#" + this.mountId);

				}
			}

			/*弹出框*/
			getInstance(createCoverDiv);
			getInstance(createPopUpBox);
            /*编辑区域*/
            creatEditDiv(this);
			/*end*/
          

			this.slderLeftOffset = $("#" + this.mountId).offset().left; //时间轴距离左页面的距离


			$(backgroundDiv).mousedown(function (e) {
				var event = e ? e : window.event;
				self.createDrag({
					backgroundDiv : this,
					ex : event.pageX,
				})

			})

			/*时间初始化*/
			if (Object.prototype.toString.call(obj.defaultTime) == "[object Array]") {
				this.timeInit(obj.defaultTime);
			} else if (obj.defaultTime) {
				throw new Error('时间初始化需要数组格式');
			}

		},
		/*时间初始化*/
		timeInit : function (data) {
			_.map(data, function (item, index) {
				var startTime = item.split("-")[0];
				var stopTime = item.split("-")[1];
				var timeArray = new Array();
				var _timeArray = new Array();
				var event = this.events_array[index];
				timeArray.push(startTime);
				timeArray.push(stopTime);
				_timeArray = this.getSliderOffsetX(timeArray);
				this.createDrag({
					backgroundDiv : this.mountId,
					ex : _timeArray[0],
					ex2 : _timeArray[1],
					events : event,
				})
			}.bind(this))
		},

		/*提供给用户的接口，删除某个时间轴上所有时间段，并重新设置*/
		setTime : function (setObj) {
            var setTimeArray=setObj.setTimeArray;
			if (Object.prototype.toString.call(setTimeArray) == "[object Array]") {				
                this.removeAll();
                if(0===setTimeArray.length)
                {
                    return;
                }
                this.events_array=setObj.setEventsArray;
				this.timeInit(setTimeArray);
			} else if (setTimeArray) {
				throw new Error('时间初始化需要数组格式');
			}
		},

		/*删除当前时间轴上所有时间段*/
		removeAll : function () {
			var len = this.right_array.length;
			for (var i = len; i--; ) {
				$("#timeS" + this.timeSliderNum + "_" + i).remove();
			}
			this.right_array.splice(0, len);
			this.left_array.splice(0, len);
			this.rightTime_array.splice(0, len);
			this.leftTime_array.splice(0, len);
            this.events_array.splice(0, len);
			this.dragNum = 0;
            this.leftTime=0;
            this.rightTime=0;
		},

		/*flag为1是复制时全覆盖，0是选择性覆盖*/
		copyTimeSlider : function (flag) {
			var len = this.left_array.length;
			for (var j = 0; j < 7; j++) {
				if ($("#editCBox" + this.timeSliderNum + "_" + j).prop("checked") == true) {
					var targetId = $(".trCanvas").eq(j).parent().attr("id");
					if (flag) {
						_gContextArray[j].removeAll();
					}
					for (var i = 0; i < len; i++) {
						_gContextArray[j].createDrag({
							backgroundDiv : targetId,
							ex : this.left_array[i] + this.slderLeftOffset,
							ex2 : this.right_array[i],
                            events:this.events_array[i]
						})
					}
				}
			}
		},
		/*创建拖块函数，
		obj参数：
		backgroundDiv为时间轴的背景DOM，
		ex为鼠标点击的位置，即创建的起始点
		ex2代表拖块的宽度，若不存在，则默认一个小时的宽度，
		timeStart和timeStop为拖块的初始时间显示，若不存在则根据坐标进行计算，若存在则直接显示其值*/
		createDrag : function (obj) {
			var backgroundDiv = obj.backgroundDiv;
			var ex = obj.ex;
			var ex2 = obj.ex2;
			var timeStart = obj.timeStart;
			var timeStop = obj.timeStop;
			var event = obj.events || 0;
			var self = this;
			var dragLeft = parseFloat((ex - self.slderLeftOffset).toFixed(1));

			if (ex2) //如果指明了结束时间
			{
				var dragRight = ex2;
			} else {
				var dragRight = dragLeft + self.oneDragBlockWidth;
			}
			var leftArrayLength = self.left_array.length;

			if (typeof(backgroundDiv) == "string") {
				$backgroundDiv = $("#" + backgroundDiv + " > .trCanvas");
			} else {
				$backgroundDiv = $(backgroundDiv);
			}
			/*判断新建的时间段是否超过整个时间轴右边界*/
			if ((dragLeft) >= $backgroundDiv.width() - self.oneDragBlockWidth) {
				console.log("超过")
				return;
			}

			/*判断新创建的时间段是否能放下，防止时间段重叠*/
			if (leftArrayLength >= 1) {
				for (var j = 0; j < leftArrayLength; j++) {
					if (dragRight > self.left_array[j] && dragLeft < self.right_array[j]) {
						console.log("重叠")
						return;
					}
				}
			}
			/*刚加入一个拖块就把其左右坐标进行保存*/
			self.left_array.push(dragLeft);
			self.right_array.push(dragRight);
			/*将拖块的坐标进行排序*/
			self.left_array.sort(function (a, b) {
				return a - b;
			});

			self.right_array.sort(function (a, b) {
				return a - b;
			});
			var sliderNum = self.timeSliderNum;

			/*创建拖块*/
			var drag = "<div class='timeSliderDiv'" +
				'id=timeS' + sliderNum + '_' + self.dragNum + ' ' +
				'style=left:' + dragLeft + 'px' + ';' +
				'background-color:' + '#' + defalutColor[event] + ' ' +
				'onconTextmenu="return false" ' +
				'></div>';
			$backgroundDiv.append(drag);

			var dragWidth = parseFloat((dragRight - dragLeft).toFixed(1));
			$("#timeS" + sliderNum + '_' + self.dragNum).width(dragWidth);

			$("#timeS" + sliderNum + "_" + self.dragNum).mousedown(function (e) {
				self.dragDown(e, this);
				if (document.all) { //兼容IE8
					e.originalEvent.cancelBubble = true;
				} else {
					e.stopPropagation();
				}
			})

			var bar_left = "<div class=leftBar" + " " +
				'id=leftBar' + sliderNum + "_" + self.dragNum + " " +
				"></div>";
			$("#timeS" + sliderNum + "_" + self.dragNum).append(bar_left);

			$("#leftBar" + sliderNum + "_" + self.dragNum).mouseover(function (e) {
				self.barOver(this);
			}).mousedown(function (e) {
				self.leftBarDown(e, this);
				if (document.all) { //兼容IE8
					e.originalEvent.cancelBubble = true;
				} else {
					e.stopPropagation();
				}
			}).mouseup(function (e) {
				self.barUp(this, "left");
				if (document.all) { //兼容IE8
					e.originalEvent.cancelBubble = true;
				} else {
					e.stopPropagation();
				}
			})

			var bar_right = "<div class=rightBar" + " " +
				'id=rightBar' + sliderNum + "_" + self.dragNum + " " +
				"></div>";
			$("#timeS" + sliderNum + "_" + self.dragNum).append(bar_right);

			var rightBarOffsetLeft = dragRight - dragLeft - $("#rightBar" + sliderNum + "_" + self.dragNum).width() / 2;
			$("#rightBar" + sliderNum + "_" + self.dragNum).css("left", rightBarOffsetLeft);

			$("#rightBar" + sliderNum + "_" + self.dragNum).mouseover(function (e) {
				self.barOver(this);
			}).mousedown(function (e) {
				self.rightBarDown(e, this);
				if (document.all) { //兼容IE8
					e.originalEvent.cancelBubble = true;
				} else {
					e.stopPropagation();
				}
			}).mouseup(function (e) {
				self.barUp(this, "right");
				if (document.all) { //兼容IE8
					e.originalEvent.cancelBubble = true;
				} else {
					e.stopPropagation();
				}
			})

			var left_show = "<div class=leftShow" + " " +
				'id=leftShow' + sliderNum + "_" + self.dragNum + " " +
				"></div>";

			$("#timeS" + sliderNum + "_" + self.dragNum).append(left_show);

			var right_show = "<div class=rightShow" + " " +
				'id=rightShow' + sliderNum + "_" + self.dragNum + " " +
				"></div>";

			$("#timeS" + sliderNum + "_" + self.dragNum).append(right_show);
			var rightShowOffsetLeft = dragRight - dragLeft;
			$("#rightShow" + sliderNum + "_" + self.dragNum).css("left", rightShowOffsetLeft);

			if (timeStart) {
				self.setSliderTime(dragLeft, 'leftShow' + sliderNum + '_' + self.dragNum, timeStart);
				self.setSliderTime(dragRight, 'rightShow' + sliderNum + '_' + self.dragNum, timeStop);
				self.getSliderTime();
			} else {
				self.setSliderTime(dragLeft, 'leftShow' + sliderNum + '_' + self.dragNum);
				self.setSliderTime(dragRight, 'rightShow' + sliderNum + '_' + self.dragNum);
				self.getSliderTime();
			}

			/*控制时间显示效果*/
			$("#timeS" + sliderNum + "_" + self.dragNum).hover(function () {
				$(this).addClass("hover");
				$(this).css("z-index", 5);
				$(".hover .leftShow").show();
				$(".hover .rightShow").show();
				$(".hover .leftBar").show();
				$(".hover .rightBar").show();
			}, function () {
				$(this).css("z-index", 4);
				$(".hover .leftShow").hide();
				$(".hover .rightShow").hide();
				$(".hover .leftBar").hide();
				$(".hover .rightBar").hide();
				$(this).removeClass("hover");
			})
			/*end*/
			self.dragNum++;
		},

		/*拖块按下事件，主要是用来拖拽拖块和点击弹出编辑框*/
		dragDown : function (e, thisDrag) {   
   
			$(thisDrag).css("z-index", "5");
			$(thisDrag).css("cursor", "move");
			var self = this;
			self.hasMove = false;

			var rightShowId = $(thisDrag).children(".rightShow").attr("id");
			var leftShowId = $(thisDrag).children(".leftShow").attr("id");

			var arrayLength = self.right_array.length;
			var parentOriginalLeft = parseFloat(parseFloat(this.getStyle($(thisDrag)[0], "left")).toFixed(1)); //拖块的原始偏移量
			var disX = parseFloat((e.pageX - parentOriginalLeft - self.slderLeftOffset).toFixed(1)); //鼠标在拖动块上的偏移
			var whichOne;
			/*当我去移动时间段之前，先找到当前操作的时间段在数组中的位置*/
			whichOne = self.binarySearch(self.left_array, parentOriginalLeft);
			self.whichOne = whichOne;
			var parentId = $(thisDrag).attr("id");
			var timeSliderWidth = $("#" + parentId).parent().width(); //整个滑动条宽度
			this.dragId = parentId;

			/*优化逻辑*/
			//var where;//判断当前操作的滑块是处理哪个位置，开头，中间或者结尾
			var leftBorder = 0; //左边界；
			var rightBorder = timeSliderWidth; //右边界
			var dragWidth = parseFloat(parseFloat(this.getStyle($("#" + parentId)[0], "width")).toFixed(1)); //拖块自身的宽度
			var l = 0; //移动后的拖块偏移量
			var showRight = 0;
			if (arrayLength > 1) {
				if (self.whichOne == 0) {
					rightBorder = self.left_array[self.whichOne + 1];
				} else if (self.whichOne == arrayLength - 1) {
					leftBorder = self.right_array[self.whichOne - 1]
				} else {
					leftBorder = self.right_array[self.whichOne - 1]
						rightBorder = self.left_array[self.whichOne + 1];
				}
			}
			$(document).mousemove(function (ev) {
				self.hasMove = true;
				l = parseFloat(parseFloat(ev.pageX - disX - self.slderLeftOffset).toFixed(1));
				if (l <= leftBorder) {
					l = leftBorder
				} else if (l >= (rightBorder - dragWidth)) {
					l = rightBorder - dragWidth;
				}
				showRight = parseFloat((l + dragWidth).toFixed(1));
				if (l >= leftBorder && (l + dragWidth) <= rightBorder) {
					$("#" + parentId).css({
						left : l + "px"
					});
					self.calTimeFlag = true;
				}
				if (self.calTimeFlag) {
					self.setSliderTime(l, leftShowId);
					self.setSliderTime(showRight, rightShowId);
					self.calTimeFlag = false;
				}
			})

			document.onmouseup = function () {
				$("#" + parentId).css("cursor", "auto");
				/*保存移动后的时间段的新坐标*/

				var left_new = parseFloat(parseFloat(self.getStyle($("#" + parentId)[0], "left")).toFixed(1));
				self.left_array[whichOne] = left_new;

				var right_new = left_new + parseFloat(self.getStyle($("#" + parentId)[0], "width"));
				right_new = parseFloat(right_new.toFixed(1));
				self.right_array[whichOne] = right_new;
				self.getSliderTime("move");
				$(document).off("mousemove");
				document.onmouseup = null;
				if (!self.hasMove) {
					$("#startH").val(parseInt($("#" + leftShowId).text().split(":")[0]));
					$("#startM").val(parseInt($("#" + leftShowId).text().split(":")[1]));
					$("#stopH").val(parseInt($("#" + rightShowId).text().split(":")[0]));
					$("#stopM").val(parseInt($("#" + rightShowId).text().split(":")[1]));
                    var color=$("#" + parentId).css("backgroundColor");//IE11获取的是rgb值，IE8是hex值，所以需要区分一下；
                    if(_.indexOf(color,"#")==-1)
                    {
                        var colorHex = rgbToHex($("#" + parentId).css("backgroundColor"));
                    }
                    else{
                        var colorHex = color.replace('#',"");
                    }			
                    var eventIndex = _.indexOf(defalutColor,colorHex) + 1;
					$("#eventSelect").val(eventIndex);
					$("#fixedDiv").show();
					$("#modalDiv").show().attr("data-number", self.timeSliderNum);
				}
				self.hasMove = false;
			}
			if (document.all) { //兼容IE8
				e.cancelBubble = true;
			} else {
				e.stopPropagation();
			}
		},

		/*左拉伸按钮鼠标按下事件 e为事件对象，thisBar为当前操作的拖块*/
		leftBarDown : function (e, thisBar) {
			$(thisBar).css("cursor", "w-resize");
			/*拉伸按钮会改变拖块的宽度*/
			var parentId = $(thisBar).parent().attr("id");
			//var parentOriginalLeft=parseInt($("#"+parentId).css("left"));//拖块的原始偏移量
			var parentOriginalLeft = parseFloat(parseFloat(this.getStyle($("#" + parentId)[0], "left")).toFixed(1)); //拖块的原始偏移量
			var leftBarOffset = parseInt($(thisBar).css("left"));

			var rightBar = $("#" + parentId).children(".rightBar").attr("id"); //右拉伸按钮
			var rightBarLeft = parseInt($("#" + rightBar).css("left"));
			var barWidth = $("#" + rightBar).width(); //拉伸按钮的宽度

			var rightShowId = $("#" + parentId).children(".rightShow").attr("id"); //显示具体时间的div
			var rightShowLeft = parseInt($("#" + rightShowId).css("left"));

			var leftShowId = $("#" + parentId).children(".leftShow").attr("id"); //显示具体时间的div
			var leftShowLeft = parseInt($("#" + leftShowId).css("left"));

			var whichOne;
			var self = this;

			var arrayLength = self.left_array.length;
			/*当我去移动时间段之前，先找到当前操作的时间段在数组中的位置*/
			whichOne = self.binarySearch(self.left_array, parentOriginalLeft);
			self.whichOne = whichOne;

			/*优化逻辑*/
			var leftBorder = 0; //左边界；

			if (arrayLength > 1) {
				if (whichOne != 0) {
					leftBorder = self.right_array[whichOne - 1];
				}
			}

			/*绑定拉伸条的移动事件*/
			$(document).mousemove(function (ev) {
				//var x=self.getMousePos(ev).x;
				var pageX = parseFloat(ev.pageX - self.slderLeftOffset);
				if (pageX <= leftBorder) {
					pageX = leftBorder;
				}
				var parentWidth = parseFloat(self.right_array[whichOne] - pageX);//拖块在移动过程中的宽度
				if (parentOriginalLeft >= pageX||parentWidth >= self.oneDragBlockWidth / 2) {
					if (pageX >= leftBorder) {
						$("#" + parentId).css({
							width : parentWidth + "px",
							left : pageX + "px"
						});
						$("#" + rightBar).css({
							left : parentWidth - barWidth / 2 + "px"
						});
						$("#" + rightShowId).css({
							left : parentWidth + "px"
						});
						self.calTimeFlag = true;
					}
				} 

				if (self.calTimeFlag) {
					self.setSliderTime(pageX, leftShowId);
					self.calTimeFlag = false;
				}
			})

			document.onmouseup = function () {
				self.barUp(thisBar, "left");
			}
		},

		/*拉伸条mouseover事件*/
		barOver : function (thisBar) {
			$(thisBar).css("cursor", "e-resize");
		},

		/*拉伸按钮鼠标松开事件thisBar为当前操作的按钮,direction为当前是操作的左边拉伸按钮还是右边拉伸按钮*/
		barUp : function (thisBar, direction) {
			var parentId = $(thisBar).parent().attr("id");
			var self = this;
			$(thisBar).css("cursor", "default");
			$(document).off("mousemove");
			document.onmousemove = null;
			document.onmouseup = null;
			if (direction == "left") {
				var left_new = parseFloat(parseFloat(this.getStyle($("#" + parentId)[0], "left")).toFixed(1));
				self.left_array[self.whichOne] = left_new;
			} else if (direction == "right") {
				var right_new = parseFloat(parseFloat(this.getStyle($("#" + parentId)[0], "left")).toFixed(1)) + parseFloat(parseFloat(this.getStyle($("#" + parentId)[0], "width")).toFixed(1));
				self.right_array[self.whichOne] = right_new;
			}
			self.getSliderTime("move",direction);
		},

		/*右拉伸按钮鼠标按下事件 e为事件对象，thisBar为当前操作的按钮*/
		rightBarDown : function (e, thisBar) {
			var parentId = $(thisBar).parent().attr("id");
			var rightShowId = $("#" + parentId).children(".rightShow").attr("id");
			var rightShowLeft = $("#" + rightShowId).css("left");
			var parentOriginalLeft = parseFloat(parseFloat(this.getStyle($("#" + parentId)[0], "left")).toFixed(1)); //拖块的原始偏移量
			var parentOriginalWidth = parseFloat(parseFloat(this.getStyle($("#" + parentId)[0], "width")).toFixed(1)); //拖块的原始宽度
			var originalRight = parentOriginalLeft + parentOriginalWidth; //拖块原始右坐标
			var whichOne;
			var self = this;
			var timeSliderWidth = $(thisBar).parent().parent().width(); //整个滑动条宽度
			var rightBar = $("#" + parentId).children(".rightBar").attr("id"); //右拉伸按钮
			var barWidth = $("#" + rightBar).width(); //拉伸按钮的宽度
			var len = self.left_array.length;

			whichOne = self.binarySearch(self.left_array, parentOriginalLeft);
			self.whichOne = whichOne;

			/*优化逻辑*/
			var rightBorder = timeSliderWidth //左边界；

				if (len > 1) {
					if (whichOne != len - 1) {
						rightBorder = self.left_array[whichOne + 1];
					}
				}

				$(document).mousemove(function (ev) {
					var pageX = parseFloat(ev.pageX - self.slderLeftOffset);
					if (pageX >= timeSliderWidth) {
						pageX = timeSliderWidth;
					}

					var parentWidth = pageX - parentOriginalLeft; //现在拖块的宽度

					if (parentWidth >= self.oneDragBlockWidth / 2) {
						if (pageX >= rightBorder) {
							pageX = rightBorder;
						}
						var parentWidth = pageX - parentOriginalLeft;
						$("#" + parentId).css({
							width : parentWidth + "px"
						});
						$("#" + rightShowId).css({
							left : parentWidth + "px"
						});
						$(thisBar).css({
							left : parentWidth - barWidth / 2 + "px"
						});
						self.calTimeFlag = true;
					}

					if (self.calTimeFlag) {
						self.setSliderTime(pageX, rightShowId);
						self.calTimeFlag = false;
					}

				})
				document.onmouseup = function () {
				self.barUp(thisBar, "right");
			}
		},
		/*设置当前的显示时间
		参数offsetX为偏移量，id为显示时间的DOM id
		 */
		setSliderTime : function (offsetX, id) {
			var direction = id.substring(0, 1);
			var self = this;
			var tmpHour = Math.floor(offsetX / self.oneHourWidth);
			var min = Math.round(offsetX % self.oneHourWidth * 60 / self.oneHourWidth);
			if (min < 10) {
				min = "0" + min;
			} else if (min == 60) {
				min = "00";
				tmpHour += 1;
			}
			var hour = tmpHour.toString().length < 2 ? "0" + tmpHour : tmpHour;

			$("#" + id).text(hour + ":" + min);
			if (direction == "l") {
				this.leftTime = hour + ":" + min;
			} else {
				this.rightTime = hour + ":" + min;
			}
		},
		/*获取当前的拖块的显示时间，并存入数组，按从小到大顺序排列/
         action为拖块是否在移动，移动分为两种，拖动拖块和拖动拉伸条
         拖动拖块时开始和结束时间都更新，拖动拉伸条时只更新一个时间，由direction决定
        */
		getSliderTime : function (action,direction) {         
			if (action == "move") {
                if("right"===direction)
                {
                    this.rightTime_array[this.whichOne] = this.rightTime;
                }
                else if("left"===direction)
                {
                    this.leftTime_array[this.whichOne] = this.leftTime;
                }
                else{
                    this.rightTime_array[this.whichOne] = this.rightTime;
                    this.leftTime_array[this.whichOne] = this.leftTime;
                }               
			} else {
				this.leftTime_array.push(this.leftTime);
				this.rightTime_array.push(this.rightTime);
			}         
			this.leftTime_array.sort(function (a, b) {
				var A = parseInt(a.split(":")[0]) * 60 + parseInt(a.split(":")[1]);
				var B = parseInt(b.split(":")[0]) * 60 + parseInt(b.split(":")[1]);
				return A - B;
			});
			this.rightTime_array.sort(function (a, b) {
				var A = parseInt(a.split(":")[0]) * 60 + parseInt(a.split(":")[1]);
				var B = parseInt(b.split(":")[0]) * 60 + parseInt(b.split(":")[1]);
				return A - B;
			});          
		},
		/*获取当前对应时间的left偏移量，参数time为传进来的时间数组
		返回值：
		timeArray[0]为开始时间对应的偏移量
		timeArray[1]为结束时间对应的偏移量
		 */
		getSliderOffsetX : function (time) {
			var timeArray = new Array;
			var self = this;
			var startH = parseInt(time[0].split(":")[0]) * self.oneHourWidth;
			var startM = parseInt(time[0].split(":")[1]) * self.oneHourWidth / 60;
			startM = parseFloat(startM.toFixed(1));
			var stopH = parseInt(time[1].split(":")[0]) * self.oneHourWidth;
			var stopM = parseInt(time[1].split(":")[1]) * self.oneHourWidth / 60;
			stopM = parseFloat(stopM.toFixed(1));
			var startTime = startH + startM + self.slderLeftOffset;
			var stopTime = stopH + stopM;
			timeArray[0] = startTime;
			timeArray[1] = stopTime;
			return timeArray
		},
		/*
		获取当前元素真实的属性值
		element为当前元素
		attr为具体属性
		 */
		getStyle : function (element, attr) {
			if (element.currentStyle) {
				return element.currentStyle[attr];
			} else {
				return getComputedStyle(element, false)[attr];
			}
			return style;
		},
		/*获取鼠标位置，为了兼容ie8
		Firefox支持属性pageX,与pageY属性，这两个属性已经把页面滚动计算在内了,
		在Chrome可以通过document.body.scrollLeft，document.body.scrollTop计算出页面滚动位移，
		而在IE下可以通过document.documentElement.scrollLeft ，document.documentElement.scrollTop */
		getMousePos : function (event) {
			var e = event || window.event;
			var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
			var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
			var x = e.pageX || e.clientX + scrollX;
			var y = e.pageY || e.clientY + scrollY;
			return {
				'x' : x,
				'y' : y
			};
		},
        binarySearch :function(arr, target) {
            var s = 0;
            var e = arr.length - 1;
            var m = Math.floor((s + e) / 2);
            var sortTag = arr[s] <= arr[e];//确定排序顺序

            while (s < e && arr[m] !== target) {
                if (arr[m] > target) {
                    sortTag && (e = m - 1);
                    !sortTag && (s = m + 1);
                } else {
                    !sortTag && (e = m - 1);
                    sortTag && (s = m + 1);
                }
                m = Math.floor((s + e) / 2);
            }

            if (arr[m] == target) {
                return m;
            } else {
                return false;
            }
        }
	}

	window.TimeSlider = TimeSlider;
})()
