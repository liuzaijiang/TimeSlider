(function(){
    var g_startClickTimeStamp; //消除IE8下click时会触发mousmove，在这里增加时间戳延迟判断;
	var g_stopClickTimeStamp;
	var g_instanceCtxArray = new Array(); //存放每个时间轴对象实例的上下文this的数组
	var g_language = 1; //0代表英文，1代表中文
    
    
    //解决IE8之类不支持getElementsByClassName
    function getElementsByClassName(className, root, tagName) {    //root：父节点，tagName：该节点的标签名。 这两个参数均可有可无 
        if (root) { 
            root = typeof root == "string" ? document.getElementById(root) : root; 
        } else { 
            root = document.body; 
        } 
        tagName = tagName || "*"; 
        if (document.getElementsByClassName) { //如果浏览器支持getElementsByClassName，就直接的用 
            return root.getElementsByClassName(className); 
        } else { 
            var tag = root.getElementsByTagName(tagName); //获取指定元素 
            var tagAll = []; //用于存储符合条件的元素 
            for (var i = 0; i < tag.length; i++) { //遍历获得的元素 
                for (var j = 0, n = tag[i].className.split(' ') ; j < n.length; j++) {//遍历此元素中所有class的值，如果包含指定的类名，就赋值给tagnameAll 
                    if (n[j] == className) { 
                        tagAll.push(tag[i]); 
                        break; 
                    } 
                } 
            } 
            return tagAll; 
        } 
    }

    //解决IE8不支持textContent;
    if (Object.defineProperty 
      && Object.getOwnPropertyDescriptor 
      && Object.getOwnPropertyDescriptor(Element.prototype, "textContent") 
      && !Object.getOwnPropertyDescriptor(Element.prototype, "textContent").get) {
      (function() {
        var innerText = Object.getOwnPropertyDescriptor(Element.prototype, "innerText");
        Object.defineProperty(Element.prototype, "textContent",
         {
           get: function() {
             return innerText.get.call(this);
           },
           set: function(s) {
             return innerText.set.call(this, s);
           }
         }
       );
      })();
    }

    //解决IE8不支持firstElementChild;
    (function(constructor) {
        if (constructor &&
            constructor.prototype &&
            constructor.prototype.firstElementChild == null) {
            Object.defineProperty(constructor.prototype, 'firstElementChild', {
                get: function() {
                    var node, nodes = this.childNodes, i = 0;
                    while (node = nodes[i++]) {
                        if (node.nodeType === 1) {
                            return node;
                        }
                    }
                    return null;
                }
            });
        }
    })(window.Node || window.Element);

    //获取鼠标位置，解决IE8不支持pageX
    function getMousePos(event) { 
      var e = event || window.event; 
      var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft; 
      var scrollY = document.documentElement.scrollTop || document.body.scrollTop; 
      var x = e.pageX || e.clientX + scrollX; 
      var y = e.pageY || e.clientY + scrollY; 
      return { 'x': x, 'y': y }; 
    } 
    
    //将字符串转换为dom对象
    function createDOMFromString (str) {
           var tmpDiv = document.createElement('div');
           tmpDiv.innerHTML = str;
           return tmpDiv.firstElementChild || null;
    }

    //获取元素的渲染至页面上的样式
    function getStyle(element, attr) {
        if (element.currentStyle) {
            return element.currentStyle[attr];
        } else {
            return getComputedStyle(element, false)[attr];
        }
	}
    
    var defalutColor = ["007acc", 'a5df12', 'eaaae4', '04d4d4', 'd32311'];
    _.forEach(getElementsByClassName('eventBox',"","div"), function (item, index) {
        item.style.backgroundColor="#" + defalutColor[index];
	})
    
    
    //将颜色从rgb转换为16进制格式
	function rgbToHex(rgb) {
		var _rgb = rgb.match(/[^\(\)]+(?=\))/g)[0].split(",");
		if (_rgb) {
			var hex = "";
			_.forEach(_rgb, function (item) {
				hex += ("0" + parseInt(item, 10).toString(16)).slice(-2);
			})
			return (hex);
		}
	}
    
    function TimeSlider(options){
        this.options=options||defaultOptions;

        //每个时间段的开始时间和结束时间都会换算成坐标被存储
        this.startTimeCoordinateArray = new Array(); //存放每个时间段的开始坐标
		this.stopTimeCoordinateArray = new Array(); //存放每个时间段的结束坐标
		this.startTimeArray = new Array(); //存放每个时间段的开始时间
		this.stopTimeArray = new Array(); //存放每个时间段的结束时间
		this.infosArray = new Array(); //存放每个时间轴的所有时间段上的信息数组，例如2:00-4:00这个时间段用来绑定移动侦测事件
		this.curStartTime = 0; //存放当前操作时间段的开始时间
		this.curStopTime = 0; //存放当前操作时间段的结束时间
        this.curTimeBlockDom=null;
        this.curStartTimeShowDom=null;
        this.curStopTimeShowDom=null;
		this.lastStartCoordinate = 0; //存放最后一个被创建时间段的开始坐标
		this.timeSliderWidth = 0; //时间轴宽度
		this.sliderLeftOffset = 0; //时间轴距离页面最左边的距离
		this.oneTimeBlockWidth = 0; //手动创建时间段的默认宽度
		this.oneHourWidth = 0; //每一个小时占的宽度
		this.oneMinWidth = 0; //每一个分钟占的宽度
		this.timeBlockNums = 0; //时间段个数
		this.hasMove = false; //判断时间段是click事件还是move事件
		this.whichOne = 0; //目前操纵的时间段在坐标数组中的索引
		this.timeSliderNums = 0; //TimeSlider实例个数
		this.curTimeBlockId = null; //当前操作的时间段的ID
		this.mountedId = null; //当前挂载的真实DOM的ID
        this.wrapperDivDiv=null;//时间轴所有元素的外部定位DOM
		this.curInfo = null; //当前时间段的信息
        this.defaultOneTimeBlockTime = 30;//手动创建时间段的默认时间间隔(min)
        
		g_language = this.options.language == "en" ? 0 : 1;
		this.init(); //总初始化开始 
    }
    
    TimeSlider.prototype = {
        sliderTotalNums : 0, //TimeSlider实例个数
        init:function(){
            if(!this.options.mountedId||!document.getElementById(this.options.mountedId)){
                throw new Error('需要提供一个正确的挂载ID');
                return
            }
            g_instanceCtxArray.push(this);
			TimeSlider.prototype.sliderTotalNums++;
			this.timeSliderNums = TimeSlider.prototype.sliderTotalNums;
			this.createLayout();
        },
        /*创建整个时间轴的DOM结构*/
        createLayout:function(){
            var self = this; //保存当前上下文;
            var options=this.options;
            
            self.mountedId = options.mountedId;
            self.infosArray = options.defaultInfos || [];
            self.defaultOneTimeBlockTime=parseInt(options.defaultOneTimeBlockTime)|| self.defaultOneTimeBlockTime;
            var mountedElement= document.getElementById(self.mountedId);

            var wrapperDiv = document.createElement("div");
            wrapperDiv.className="timeSlider";
            mountedElement.appendChild(wrapperDiv);
            self.wrapperDiv=wrapperDiv;
            
            var backgroundDiv = document.createElement("div");
            backgroundDiv.className="trCanvas";     
            wrapperDiv.appendChild(backgroundDiv);
            
            backgroundDiv.onmousedown=function(event){
                var e = event||window.event;
                self.manualCreation(e);
            }
            
           
            //这样获取的元素宽度是其盒模型的content内容，不包含border及padding
            self.timeSliderWidth = parseInt(getStyle(backgroundDiv,'width'));
            //getBoundingClientRect是获取元素相对于视口的偏移，而后面利用的是pageX进行计算，是针对整个窗口，所以需要加上滚轮的偏移document.documentElement.scrollLeft
            self.sliderLeftOffset = (wrapperDiv.getBoundingClientRect().left+document.documentElement.scrollLeft); //时间轴距离左页面的距离
            self.oneHourWidth = parseFloat((self.timeSliderWidth / 24).toFixed(4)); //每一个小时占的宽度
            self.oneMinWidth = parseFloat((self.timeSliderWidth / 24 / 60).toFixed(4)); //每一个分钟占的宽度         
            self.oneTimeBlockWidth = parseFloat((self.timeSliderWidth / 24 / 60 * self.defaultOneTimeBlockTime).toFixed(4)); //手动创建时间段的默认宽度

            //创建0-24小时的标注
			for (var i = 0; i < 25; i++) {
				var coordinateDiv = document.createElement("div");
                coordinateDiv.className='coordinate';
                coordinateDiv.style.left=self.oneHourWidth * i + "px";
                wrapperDiv.appendChild(coordinateDiv);

				var labelDiv = document.createElement("label");
				if (i < 10) {
                    labelDiv.className='coordinateLabDiv';
                    labelDiv.textContent=i;
                    labelDiv.style.left=self.oneHourWidth * i + "px";
                    wrapperDiv.appendChild(labelDiv);
	
				} else {
                    labelDiv.className='coordinateLabDiv';
                    labelDiv.textContent=i;
                    labelDiv.style.left=self.oneHourWidth * i + "px";
                    labelDiv.style.marginLeft="-7px";
                    wrapperDiv.appendChild(labelDiv);           
				}
			}
 
            
            //弹出框(使用了单例模式)
			getInstance(createCoverDiv);
			getInstance(createPopUpBox);
            //编辑区域
			creatEditDiv(self);
            
            /******************时间段初始化start*****************/
			if (Object.prototype.toString.call(options.defaultTime) == "[object Array]") {
				self.timeBlockInit(options.defaultTime);
			} else if (options.defaultTime) {
				throw new Error('时间初始化需要数组格式');
			}
        },
        manualCreation:function(e){
            var self = this;
			var startTimeCoordinate = parseFloat((getMousePos(e).x - self.sliderLeftOffset).toFixed(4));
			var stopTimeCoordinate;
			var startHour = Math.floor(startTimeCoordinate / self.oneHourWidth);
			var startMin = Math.floor(startTimeCoordinate % self.oneHourWidth / self.oneMinWidth);
            //结束时间直接用开始时间加上设置的时间间隔更精确，不用再进行换算
			var stopMin = startMin+self.defaultOneTimeBlockTime;
            if(stopMin>60){
                var stopHour = startHour+1;
                stopMin-=60;
            }else{
                var stopHour = startHour;
            }

			if (startMin < 10) {
				startMin = "0" + startMin;
			} 
			if (stopMin < 10) {
				stopMin = "0" + stopMin;
			} 
            
			var hour1 = startHour.toString().length < 2 ? "0" + startHour : startHour;
			var startTime = hour1 + ":" + startMin;

			var hour2 = stopHour.toString().length < 2 ? "0" + stopHour : stopHour;
			var stopTime = hour2 + ":" + stopMin;

            //创建时间段
			self.createTimeBlock({
				startTime : startTime,
				stopTime : stopTime
			})

			//添加时间段的时候默认添加事件0
			self.whichOne = _.sortedIndex(self.startTimeArray,startTime);
			self.infosArray.splice(self.whichOne, 0, 0);
        },
        /*
        获取当前对应时间的坐标
		 */
		time2Coordinate : function (time) {
			var coordinate;
			var self = this;
            var hourCoordinate = parseInt(time.split(":")[0], 10) * self.oneHourWidth;;
            var minCoordinate = parseInt(time.split(":")[1], 10) * self.oneMinWidth;
            minCoordinate = parseFloat(minCoordinate.toFixed(4));
            coordinate=hourCoordinate+minCoordinate;
			return coordinate
		},
        /*设置当前的显示时间
		参数offsetX为偏移量
        返回值：
		time1[0]为开始时间
		time2[1]为结束时间
		 */
		coordinate2Time : function (coordinate) {
			var self = this;
			var tmpHour = Math.floor(coordinate / self.oneHourWidth);
			var min = Math.floor(coordinate % self.oneHourWidth / self.oneMinWidth);
            var time;
			if (min < 10) {
				min = "0" + min;
			} else if (min == 60) {
				min = "00";
				tmpHour += 1;
			} 
            
			var hour = tmpHour.toString().length < 2 ? "0" + tmpHour : tmpHour;
		
            time=hour+":"+min;
            return time
		},
 
		saveCurTimeBlockTime : function (action, direction) {
            var self=this;
            self.startTimeArray.push(self.curStartTime);
            self.stopTimeArray.push(self.curStopTime);
           
			self.startTimeArray.sort(function (a, b) {
				var A = parseInt(a.split(":")[0], 10) * 60 + parseInt(a.split(":")[1], 10);
				var B = parseInt(b.split(":")[0], 10) * 60 + parseInt(b.split(":")[1], 10);
				return A - B;
			});
			self.stopTimeArray.sort(function (a, b) {
				var A = parseInt(a.split(":")[0], 10) * 60 + parseInt(a.split(":")[1], 10);
				var B = parseInt(b.split(":")[0], 10) * 60 + parseInt(b.split(":")[1], 10);
				return A - B;
			});
			// IE8下使用parseInt对于数字08,07,06.....等数字进行转换时会变成0
			// IE8下面parseint默认会把“08”、“09”当成八进制，但是又发现不是合法的八进制，最后就抛出了0这个false。
			// 解决方法1，加个参数：parseInt(numString, 10)
			// 解决方法2，用new Number转成数字 var num = new Number(numString);
			// 解决方法3，换成parseFloat：parseFloat(numString)

		},
        /*
		创建时间段函数
        */
		createTimeBlock : function (obj) {
			var self = this;
            var startTimeCoordinate=self.time2Coordinate(obj.startTime);
			var stopTimeCoordinate = self.time2Coordinate(obj.stopTime) || parseFloat((startTimeCoordinate + self.oneTimeBlockWidth).toFixed(4));
            var info = obj.info || 0;    
			/**************对于时间段创建时错误校验start***************/
			//错误数据处理：后台数据错误，导致结束时间大于开始时间
			if (stopTimeCoordinate <= startTimeCoordinate) {
				return;
			}

			//判断新建的时间段是否超过整个时间轴右边界
			if ((startTimeCoordinate) > self.timeSliderWidth - self.oneTimeBlockWidth) {
				return;
			}

			//判断新创建的时间段是否与已存在时间段重叠
			if (self.timeBlockNums >= 1) {
				for (var j = 0; j < self.timeBlockNums; j++) {
					if (stopTimeCoordinate > self.startTimeCoordinateArray[j] && startTimeCoordinate < self.stopTimeCoordinateArray[j]) {
						return;
					}
				}
			}
			/**************对于时间段创建时错误校验end****************/

			/**************时间段创建start****************/
			//刚加入一个时间段就把其左右坐标进行保存
			self.startTimeCoordinateArray.push(startTimeCoordinate);
			self.stopTimeCoordinateArray.push(stopTimeCoordinate);
			self.startTimeCoordinate = startTimeCoordinate;
			//将时间段的坐标进行排序
			self.startTimeCoordinateArray.sort(function (a, b) {
                    return a - b;
			});
			self.stopTimeCoordinateArray.sort(function (a, b) {
                    return a - b;
			});

			var sliderNum = self.timeSliderNums; //当前时间轴索引

			//动态创建时间段
			var timeBlockDataObj = {
				sliderNum : sliderNum,
				timeBlockNums : self.timeBlockNums,
				startTimeCoordinate : startTimeCoordinate,
				timeBlockWidth : parseFloat((stopTimeCoordinate - startTimeCoordinate).toFixed(4)),
				defalutColor : defalutColor[info]
			}        

			var timeBlockSting = [
				'<div class="timeSliderDiv"',
				'id="timeS<%=sliderNum%>_<%=timeBlockNums%>"',
				'style=left:<%=startTimeCoordinate%>px;',
				'width:<%=timeBlockWidth%>px;',
				'background-color:#<%=defalutColor%>;',
				'></div>'
			].join("");
            
			timeBlockSting = _.template(timeBlockSting);
			var timeBlockDom = createDOMFromString(timeBlockSting(timeBlockDataObj));
            self.wrapperDiv.appendChild(timeBlockDom);
			//为时间段绑定点击事件
            timeBlockDom.onmousedown=function(event){
                var e = event||window.event;
                self.timeBlockMouseDown(e, this,startTimeShowDom,stopTimeShowDom);
                if (document.all) { //兼容IE8防止冒泡
					e.cancelBubble = true;
				} else {
					e.stopPropagation();
				}
            }
            //mouseenter/mouseleave和mouseover/mouseout的区别就是前者元素的子元素也会触发此事件，后者不会
            timeBlockDom.onmouseenter=function(){
                this.className += ' hover';
                this.style.zIndex=5;
                startTimeBarDom.style.display="block";
                stopTimeBarDom.style.display="block";
                startTimeShowDom.style.display="block";
                stopTimeShowDom.style.display="block";

            }
            
            timeBlockDom.onmouseleave=function(){
                this.style.zIndex=4;
                startTimeBarDom.style.display="none";
                stopTimeBarDom.style.display="none";
                startTimeShowDom.style.display="none";
                stopTimeShowDom.style.display="none";
                this.className = this.className.replace('hover', '');
            }


			/**************时间段拉伸按钮创建start****************/
			var bar_string = [
				'<div class="<%=barClass%>"',
				'id="<%=barId%>"',
				'></div>'
			].join("");
			bar_string = _.template(bar_string);

			var startTimeBarDataObj = {
				barClass : 'startTimeBar',
				barId : 'startTimeBar' + sliderNum + '_' + self.timeBlockNums
			}

			var stopTimeBarDataObj = {
				barClass : 'stopTimeBar',
				barId : 'stopTimeBar' + sliderNum + '_' + self.timeBlockNums
			}

			var startTimeBarDom = createDOMFromString(bar_string(startTimeBarDataObj));
			var stopTimeBarDom = createDOMFromString(bar_string(stopTimeBarDataObj));

            timeBlockDom.appendChild(startTimeBarDom);
            timeBlockDom.appendChild(stopTimeBarDom);

            startTimeBarDom.onmouseover=function(e){
                this.style.cursor='e-resize';    
            }
            
            startTimeBarDom.onmousedown=function(event){
                var e=event||window.event;
                self.startTimeBarDown(e, this,timeBlockDom,startTimeShowDom);
				if (document.all) { //兼容IE8
					e.cancelBubble = true;
				} else {
					e.stopPropagation();
				}
            }
            
            
            stopTimeBarDom.onmouseover=function(e){
                this.style.cursor='e-resize';
            }
            
            stopTimeBarDom.onmousedown=function(e){
                var e=event||window.event;
                self.stopTimeBarDown(e, this,timeBlockDom,stopTimeShowDom);
				if (document.all) { //兼容IE8
					e.cancelBubble = true;
				} else {
					e.stopPropagation();
				}
            }
			/**************时间段拉伸按钮创建end****************/

            
			/**************时间段时间显示区域创建start***************/
			var time_show_string = [
				'<div class="<%=timeShowClass%>"',
				'id="<%=timeShowId%>"',
				'></div>'
			].join("");
			time_show_string = _.template(time_show_string);

			var startTimeShowDataObj = {
				timeShowClass : 'startTimeShow',
				timeShowId : 'startTimeShow' + sliderNum + '_' + self.timeBlockNums
			}

			var stopTimeShowDataObj = {
				timeShowClass : 'stopTimeShow',
				timeShowId : 'stopTimeShow' + sliderNum + '_' + self.timeBlockNums
			}
			var startTimeShowDom = createDOMFromString(time_show_string(startTimeShowDataObj));
			var stopTimeShowDom = createDOMFromString(time_show_string(stopTimeShowDataObj));

            timeBlockDom.appendChild(startTimeShowDom);
            timeBlockDom.appendChild(stopTimeShowDom);
            
            if(obj.startTime.split(':')[0].length<2){
                obj.startTime='0'+obj.startTime;
            }

            if(obj.stopTime.split(':')[0].length<2){
                obj.stopTime='0'+obj.stopTime;
            }
            
            if(obj.startTime.split(':')[1].length<2){
                obj.startTime=obj.startTime.split(':')[0]+':'+'0'+obj.startTime.split(':')[1];
            }
            
            if(obj.stopTime.split(':')[1].length<2){
                obj.stopTime=obj.stopTime.split(':')[0]+':'+'0'+obj.stopTime.split(':')[1];
            }
            
			var startTime=self.curStartTime=obj.startTime;
			var stopTime=self.curStopTime=obj.stopTime;

            
            startTimeShowDom.textContent=startTime;
            stopTimeShowDom.textContent=stopTime;
            
			self.saveCurTimeBlockTime();//将创建好的时间段的时间存入数组中
            self.timeBlockNums++;
			/**************时间段时间显示区域创建end****************/
            
			/**************时间段创建end****************/
		},
        startTimeBarDown:function(e,thisBar,timeBlockDom,startTimeShowDom){
            g_startClickTimeStamp = new Date().getTime();
            thisBar.style.cursor='w-resize';
			var self = this;
			var startTimeCoordinate;
			/*当去移动时间段之前，先找到当前操作的时间段在数组中的位置*/
			self.whichOne = _.sortedIndex(self.startTimeArray, startTimeShowDom.textContent);
			var oldStartTimeCoordinate = self.startTimeCoordinateArray[self.whichOne];//时间段的原始开始坐标
			var mouseRelativeOffsetX = parseFloat((oldStartTimeCoordinate - (getMousePos(e).x - self.sliderLeftOffset)).toFixed(4));
			/*寻找边界*/
			var leftBorder = 0; //左边界；

            
			if (self.timeBlockNums > 1) {
				if (self.whichOne != 0) {
					leftBorder = self.stopTimeCoordinateArray[self.whichOne - 1];
				}
			}
            document.onmousemove=function(event){
                var e = event||window.event;
                g_stopClickTimeStamp = new Date().getTime();
				if (g_stopClickTimeStamp - g_startClickTimeStamp > 100) { //消抖
					startTimeCoordinate = parseFloat((getMousePos(e).x - self.sliderLeftOffset + mouseRelativeOffsetX).toFixed(4)); //偏移量          
					if (startTimeCoordinate <= leftBorder) {
						startTimeCoordinate = leftBorder;
					}else if(startTimeCoordinate>=self.stopTimeCoordinateArray[self.whichOne]-self.oneTimeBlockWidth){//往右拉的限制范围
                        startTimeCoordinate=self.stopTimeCoordinateArray[self.whichOne]-self.oneTimeBlockWidth;
                    }
					var timeBlockWidth_present = parseFloat((self.stopTimeCoordinateArray[self.whichOne] - startTimeCoordinate).toFixed(4)); //时间段在移动过程中的宽度				                   
                    if (startTimeCoordinate >= leftBorder) {
                        timeBlockDom.style.left=startTimeCoordinate + 'px';
                        timeBlockDom.style.width=timeBlockWidth_present + 'px';
                        startTimeShowDom.textContent=self.coordinate2Time(startTimeCoordinate);
                    }
				}
            }
			
            document.onmouseup=document.onmouseleave=function(){
                thisBar.style.cursor='default';
                self.curStartTime=startTimeShowDom.textContent;
                self.startTimeCoordinateArray[self.whichOne]=startTimeCoordinate;
				self.startTimeArray[self.whichOne] = self.curStartTime;
                document.onmousemove=document.onmouseup=document.onmouseleave=null;              
            };
            
			if (document.all) { //兼容IE8
				e.cancelBubble = true;
			} else {
				e.stopPropagation();
			}
        },
        stopTimeBarDown:function(e, thisBar,timeBlockDom,stopTimeShowDom){
            g_startClickTimeStamp = new Date().getTime();
			var self = this;			
			var timeSliderWidth = self.timeSliderWidth; //整个滑动条宽度
			var stopTimeCoordinate;
            var stopTime;
			self.whichOne = _.sortedIndex(self.stopTimeArray, stopTimeShowDom.textContent); //寻找当前时间段索引
			var oldStartTimeCoordinate = self.startTimeCoordinateArray[self.whichOne]; //时间段的原始偏移量
			var mouseRelativeOffsetX = parseFloat((getMousePos(e).x - self.sliderLeftOffset - self.stopTimeCoordinateArray[self.whichOne]).toFixed(4)); //鼠标的相对位移
			//寻找边界值
			var rightBorder = timeSliderWidth; //右边界

			if (self.timeBlockNums > 1) {
				if (self.whichOne != self.timeBlockNums - 1) {
					rightBorder = self.startTimeCoordinateArray[self.whichOne + 1];
				}
			}
            
            document.onmousemove=function(event){
                var e=event||window.event
                g_stopClickTimeStamp = new Date().getTime();
				if (g_stopClickTimeStamp - g_startClickTimeStamp > 50) { //消抖
					stopTimeCoordinate = parseFloat((getMousePos(e).x - self.sliderLeftOffset - mouseRelativeOffsetX).toFixed(4));
					if (stopTimeCoordinate >= timeSliderWidth) {
						stopTimeCoordinate = timeSliderWidth;
					}else if(stopTimeCoordinate<=self.startTimeCoordinateArray[self.whichOne]+self.oneTimeBlockWidth){//往左拉的限制范围
                        stopTimeCoordinate=self.startTimeCoordinateArray[self.whichOne]+self.oneTimeBlockWidth;
                    }
                    if (stopTimeCoordinate >= rightBorder) {
                        stopTimeCoordinate = rightBorder;
                    }
                    
                    var timeSliderWidth_present = parseFloat((stopTimeCoordinate - oldStartTimeCoordinate).toFixed(4));
                    timeBlockDom.style.width=timeSliderWidth_present + "px";
                    stopTime=self.coordinate2Time(stopTimeCoordinate);
                    stopTimeShowDom.textContent=stopTime;
				}
            }
			
            document.onmouseleave=document.onmouseup=function(){
                thisBar.style.cursor='default';
                self.curStopTime=stopTimeShowDom.textContent;
                self.stopTimeCoordinateArray[self.whichOne]=stopTimeCoordinate;
                self.stopTimeArray[self.whichOne] = self.curStopTime;
                document.onmousemove=document.onmouseup=document.onmouseleave=null;          
            }

			if (document.all) { //兼容IE8
				e.cancelBubble = true;
			} else {
				e.stopPropagation();
			}
        },
        timeBlockInit:function(data){
            //隐藏复制框
            var domArray=getElementsByClassName('editContent','','div');
            for(var i=0;i<domArray.length;i++){
                domArray[i].style.display='none';
            }
            
            var self=this;
            for(var i=0;i<data.length;i++){
                var item=data[i];
                var startTime = item.split("-")[0];
				var stopTime = item.split("-")[1];
                var info = self.infosArray[i];

				self.createTimeBlock({
					startTime :startTime,
					stopTime : stopTime,
					info : info
				})
            }
        },
        timeBlockMouseDown:function(e,thisTimeBlock,startTimeShowDom,stopTimeShowDom){
            g_startClickTimeStamp = new Date().getTime();
			g_stopClickTimeStamp = new Date().getTime();
			var self = this;
            self.curTimeBlockDom=thisTimeBlock;
            self.curStartTimeShowDom=startTimeShowDom;
            self.curStopTimeShowDom=stopTimeShowDom;
			/*当我去移动时间段之前，先找到当前操作的时间段在数组中的位置*/
            self.curStartTime=startTimeShowDom.textContent;
            self.curStopTime=stopTimeShowDom.textContent; 
			self.whichOne = _.sortedIndex(self.startTimeArray, self.curStartTime);
            var timeBlockWidth = parseFloat((self.stopTimeCoordinateArray[self.whichOne] - self.startTimeCoordinateArray[self.whichOne]).toFixed(4)); //时间段自身的宽度
            var timeDifferenceMins=Number(stopTimeShowDom.textContent.split(":")[0])*60+Number(stopTimeShowDom.textContent.split(":")[1])-Number(startTimeShowDom.textContent.split(":")[0])*60-Number(startTimeShowDom.textContent.split(":")[1]);         
			var originalCoordinate = self.startTimeCoordinateArray[self.whichOne]; //时间段的原始偏移量
            var mouseRelativeOffsetX = parseFloat((getMousePos(e).x - originalCoordinate - self.sliderLeftOffset).toFixed(4)); //鼠标在时间段上的偏移
            var stopTimeHour;
            var stopTimeMin;
            var stopTime;

  
            //寻找边界
			var leftBorder = 0; //左边界；
			var rightBorder = self.timeSliderWidth; //右边界
			var startTimeCoordinate= 0; //移动后的时间段坐标
			var stopTimeCoordinate = 0;
            
            
			if (self.timeBlockNums > 1) {
				if (self.whichOne == 0) {
					rightBorder = self.startTimeCoordinateArray[self.whichOne + 1];
				} else if (self.whichOne == self.timeBlockNums - 1) {
					leftBorder = self.stopTimeCoordinateArray[self.whichOne - 1];
				} else {
					leftBorder = self.stopTimeCoordinateArray[self.whichOne - 1];
					rightBorder = self.startTimeCoordinateArray[self.whichOne + 1];
				}
			}
			

            //时间段拖动的时候其宽度是不会改变的，所以结束时间等于开始时间加上时间间隔即可，不必再进行计算，避免出现误差
            document.onmousemove=function(event){
                
                var e = event||window.event;
				g_stopClickTimeStamp = new Date().getTime();
                thisTimeBlock.style.cursor='move';
				if (g_stopClickTimeStamp - g_startClickTimeStamp > 80) {
					self.hasMove = true;
					startTimeCoordinate = parseFloat((getMousePos(e).x - mouseRelativeOffsetX - self.sliderLeftOffset).toFixed(4));
                   if (startTimeCoordinate <= leftBorder) {
						startTimeCoordinate = leftBorder;
					} else if (startTimeCoordinate >= parseFloat((rightBorder - timeBlockWidth).toFixed(4))) {
						startTimeCoordinate = parseFloat((rightBorder - timeBlockWidth).toFixed(4));
					}
					stopTimeCoordinate = parseFloat((startTimeCoordinate + timeBlockWidth).toFixed(4));

					if (startTimeCoordinate >= leftBorder && stopTimeCoordinate <= rightBorder) {
						thisTimeBlock.style.left=startTimeCoordinate + "px";
						startTimeShowDom.textContent=self.coordinate2Time(startTimeCoordinate);
                        stopTimeHour=Number(startTimeShowDom.textContent.split(":")[0])+Math.floor(timeDifferenceMins/60);
                        stopTimeMin=Number(startTimeShowDom.textContent.split(":")[1])+timeDifferenceMins%60;
                        stopTimeHour+=Math.floor(stopTimeMin/60);
                        stopTimeMin-=Math.floor(stopTimeMin/60)*60;
                        if(stopTimeHour<10){
                            stopTimeHour='0'+stopTimeHour;
                        }
                        if(stopTimeMin<10){
                            stopTimeMin='0'+stopTimeMin;
                        }
 
                        
                        stopTime=stopTimeHour+":"+stopTimeMin
                        stopTimeShowDom.textContent=(stopTime);
					}
				}
            }


            document.onmouseleave=document.onmouseup=function(event){   
                var e = event||window.event;
                thisTimeBlock.style.cursor='auto';
                if (!self.hasMove) {
                    document.getElementById('startH').value=parseInt(self.curStartTime.split(':')[0], 10);
                    document.getElementById('startM').value=parseInt(self.curStartTime.split(':')[1], 10);
                    document.getElementById('stopH').value=parseInt(self.curStopTime.split(':')[0], 10);
                    document.getElementById('stopM').value=parseInt(self.curStopTime.split(':')[1], 10);
					//IE11获取的是rgb值，IE8是hex值，所以需要区分一下；
					var color=self.curTimeBlockDom.style.backgroundColor;
                    if (_.indexOf(color, "#") == -1) {
						var colorHex = rgbToHex(color);
					} else {
						var colorHex = color.replace('#', "");
					}
					var eventIndex = _.indexOf(defalutColor, colorHex) + 1;
                    document.getElementById('eventSelect').value=eventIndex;
                    fixedDiv.style.display='block';
                    modalDiv.style.display='block';
                    modalDiv.setAttribute('data-number',self.timeSliderNums);
				} else {
					self.hasMove = false;		
                    self.startTimeCoordinateArray[self.whichOne]=startTimeCoordinate;
                    self.stopTimeCoordinateArray[self.whichOne]=self.time2Coordinate(stopTime);
                    self.curStartTime=self.coordinate2Time(startTimeCoordinate);
                    self.curStopTime=stopTime;
                    self.stopTimeArray[self.whichOne] = self.curStopTime;
					self.startTimeArray[self.whichOne] = self.curStartTime;
                    thisTimeBlock.style.left=startTimeCoordinate + "px";
				}
                document.onmouseleave=document.onmouseup=document.onmousemove=null;
			}
            

			if (document.all) { //兼容IE8
				e.cancelBubble = true;
			} else {
				e.stopPropagation();
			}
        },
        /*提供给用户的接口，删除某个时间轴上所有时间段，并重新设置*/
		set : function (obj) {
			var setTimeArray = obj.setTimeArray;
			if (Object.prototype.toString.call(setTimeArray) == "[object Array]") {
				removeAllTimeBlocks(this);
				if (0 === setTimeArray.length) {
					return;
				}
				this.infosArray = obj.setInfosArray || [];
				this.timeBlockInit(setTimeArray);
			} else if (setTimeArray) {
				throw new Error('时间初始化需要数组格式');
			}
		},
		/*提供给用户的接口,返回当前时间轴上所有时间段和事件*/
		get : function () {
			var resObj = {};
			var self = this;
			resObj.times = new Array();
			resObj.infos = self.infosArray;
			_.forEach(self.startTimeArray, function (item, index) {
				resObj.times.push(item + "-" + self.stopTimeArray[index]);
			})
			return resObj;
		}
    }
    
    //创建遮罩
    var fixedDiv;
	function createCoverDiv() {
		fixedDiv = document.createElement("div");
        fixedDiv.className='fixBGDiv';
        fixedDiv.setAttribute('id','fixedDiv');
        fixedDiv.style.opacity=0.4;
		document.body.appendChild(fixedDiv)
		return "createCoverDivCall";
	}
    
    
    var popUpBoxDom;
    function createPopUpBox(){
        /* 利用_.template 模板引擎来渲染 */
		var popUpBoxString = '\
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
               </div>';

		var lan = g_language;
		var obj = {
			'modalHeaderTitile' : ["Edit", "编辑"][lan],
			'timeStartLab' : ["Start Time", "开始时间"][lan],
			'timeStopLab' : ["Stop Time", "结束时间"][lan],
			'eventLab' : ["Event Type", "事件类型"][lan],
			'eventArray' : [["Event1", "事件1"][lan], ["Event2", "事件2"][lan], ["Event3", "事件3"][lan], ["Event4", "事件4"][lan], ["Event5", "事件5"][lan]],
			'setBtnName' : ["Set", "设置"][lan],
			'delBtnName' : ["Delete", "删除"][lan],
			'calBtnName' : ["Cancel", "取消"][lan]
		}
		popUpBoxString = _.template(popUpBoxString);
		popUpBoxDom = createDOMFromString(popUpBoxString(obj));
        document.body.appendChild(popUpBoxDom);
		

		/*绑定事件*/
        var startHourInputDom=document.getElementById('startH');
        var startMinInputDom=document.getElementById('startM');
        var stopHourInputDom=document.getElementById('stopH');
        var stopMinInputDom=document.getElementById('stopM');
        
        startHourInputDom.onkeyup=startMinInputDom.onkeyup=stopHourInputDom.onkeyup=stopMinInputDom.onkeyup=_.debounce(function () {
				var id = this.id;
				var maxTime;
				if (id == "startH") {
					maxTime = 23;
				} else if (id == "stopH") {
					maxTime = 24;
				} else {
					maxTime = 59;
				}
				var regStatus = (/\D+/g).test(this.value);
				var val = this.value.replace(/^0+|\D+/g, "");
				if (!val || regStatus || val < 0 || val > maxTime) {
					this.value=0;
				}
		}, 800)
	
        var setBtnDom=document.getElementById('setBtn');
        
        setBtnDom.onclick=function(){
            var contextIndex = document.getElementById('modalDiv').getAttribute('data-number')-1;
			var self = g_instanceCtxArray[contextIndex];
            
			var STH = parseInt(startHourInputDom.value, 10);
			var STM = parseInt(startMinInputDom.value, 10);
			var SPH = parseInt(stopHourInputDom.value, 10);
			var SPM = parseInt(stopMinInputDom.value, 10);

			if (SPH < STH || (SPH == 24 && SPM > 0)) {
				alert(["Please fill in the correct time", "请填写正确的时间"][lan]);
				return;
			} else if ((STH == SPH) && (SPM < STM)) {
				alert(["Please fill in the correct time", "请填写正确的时间"][lan]);
				return;
			} else if ((SPH * 60 + SPM) - (STH * 60 + STM) < self.defaultOneTimeBlockTime) {
				alert(["At least 30 minutes apart", "间隔至少"+self.defaultOneTimeBlockTime+"分钟"][lan]);
				return;
			}
            
            
			var newStartTimeCoordinate = parseFloat((STH * self.oneHourWidth + STM * self.oneMinWidth).toFixed(4));
			var newStopTimeCoordinate = parseFloat((SPH * self.oneHourWidth + SPM * self.oneMinWidth).toFixed(4));
            //设置时间的时候把该时间段坐标删除再添加新坐标，对所有坐标重新排序
			var tmpStartTimeCoordinate = self.startTimeCoordinateArray.splice(self.whichOne, 1);
			var tmpStopTimeCoordinate = self.stopTimeCoordinateArray.splice(self.whichOne, 1);
			if (self.timeBlockNums >= 2) {
				for (var j = 0; j < self.timeBlockNums; j++) {
					if (newStopTimeCoordinate > self.startTimeCoordinateArray[j] && newStartTimeCoordinate < self.stopTimeCoordinateArray[j]) {
						alert(["Coincides with other time periods, please reset", "与其他时间段重合，请重新设置"][lan]);
						self.startTimeCoordinateArray.push(tmpStartTimeCoordinate[0]);
						self.stopTimeCoordinateArray.push(tmpStopTimeCoordinate[0]);
						self.startTimeCoordinateArray.sort(function (a, b) {
							return a - b;
						});
						self.stopTimeCoordinateArray.sort(function (a, b) {
							return a - b;
						});
						return;
					}
				}
			}
			self.startTimeCoordinateArray.push(newStartTimeCoordinate);
			self.stopTimeCoordinateArray.push(newStopTimeCoordinate);

			self.startTimeCoordinateArray.sort(function (a, b) {
				return a - b;
			});
			self.stopTimeCoordinateArray.sort(function (a, b) {
				return a - b;
			});
            
            self.curTimeBlockDom.style.left=newStartTimeCoordinate+'px';
            self.curTimeBlockDom.style.width=parseFloat((newStopTimeCoordinate - newStartTimeCoordinate).toFixed(4))+'px';
            
            
            if(STH<10){
                STH='0'+STH
            }
            if(STM<10){
                STM='0'+STM
            }
            if(SPH<10){
                SPH='0'+SPH
            }
            if(SPM<10){
                SPM='0'+SPM
            }
            var startTime=STH+":"+STM;
            var stopTime=SPH+":"+SPM;
            
 
			self.curStartTimeShowDom.textContent=startTime;
			self.curStopTimeShowDom.textContent=stopTime;

            
			/*更新时间数组里面的时间*/
            self.startTimeArray[self.whichOne]=startTime;
            self.stopTimeArray[self.whichOne]=stopTime;

            self.curTimeBlockDom.style.backgroundColor="#" + defalutColor[document.getElementById('eventSelect').value - 1];
			self.infosArray.splice(self.whichOne, 1, document.getElementById('eventSelect').value - 1);
			modalDiv.style.display='none';
            fixedDiv.style.display='none';

        }


        var delBtnDom=document.getElementById('delBtn');
        
        delBtnDom.onclick=function(){
            if(window.confirm(['Delete this time block','删除此时间段'][lan])){
                var contextIndex = modalDiv.getAttribute('data-number')-1;
                var self = g_instanceCtxArray[contextIndex];
                self.startTimeCoordinateArray.splice(self.whichOne, 1);
                self.stopTimeCoordinateArray.splice(self.whichOne, 1);
                self.startTimeArray.splice(self.whichOne, 1);
                self.stopTimeArray.splice(self.whichOne, 1);
                self.infosArray.splice(self.whichOne, 1);
                self.curTimeBlockDom.parentNode.removeChild(self.curTimeBlockDom);
                self.timeBlockNums--;
                modalDiv.style.display='none';
                fixedDiv.style.display='none';
            }
        }


        var calBtnDom=document.getElementById('calBtn');
        
        calBtnDom.onclick=function(){
            modalDiv.style.display='none';
            fixedDiv.style.display='none';
        }
        
		return 'createPopUpBoxCall';
    }
    
    //创建编辑框函数
	function creatEditDiv(context) {
		var editDivString = '\
            <div class="editWrap" id=<%="editDiv"+context.timeSliderNums%>>\
                <img src="images/edit.png" class="editImg"></img>\
                <img src="images/del.png" class="delImg"></img>\
                <div class="editContent" id=<%="editContent"+context.timeSliderNums%>>\
                    <div class="editHeader">\
                        <label class="editHeaderTitle"><%=editHeaderTitle%></label>\
                    </div>\
                    <div class="editBody">\
                      <%_.forEach(editTextObj,function(item,index){%>\
                      <%index+=1;%>\
                          <div class="editUnit">\
                             <input class=<%="editCBox"+context.timeSliderNums%> id=<%="editCBox"+context.timeSliderNums+"_"+index%> type="checkbox"></input>\
                             <label><%=item%></label>\
                          </div>\
                      <%})%>\
                           <div class="editUnit" style="width:100px;">\
                              <input class=<%="editCheckAll"+context.timeSliderNums%> type="checkbox"></input>\
                              <label><%=checkAllName%></label>\
                           </div>\
                    </div>\
                    <div class="editFotter">\
                        <button class="editBtn save"><%=saveName%></button>\
                        <button class="editBtn cancel"><%=cancelName%></button>\
                    </div>\
                </div>\
            </div>';

		var lan = g_language;
		var editTextObj = [
			["Mon.", "星期一"][lan],
			["Tue.", "星期二"][lan],
			["Wed.", "星期三"][lan],
			["Thu.", "星期四"][lan],
			["Fri.", "星期五"][lan],
			["Sat.", "星期六"][lan],
			["Sun.", "星期日"][lan]
		]
		var obj = {
			'context' : context,
			'editHeaderTitle' : ["Copy To", "复制到"][lan],
			'editTextObj' : editTextObj,
			'checkAllName' : ["Check All", "全选"][lan],
			'saveName' : ["Save", "保存"][lan],
			'cancelName' : ["Cancel", "取消"][lan]
		}

		editDivString = _.template(editDivString);
		var dom = createDOMFromString(editDivString(obj));
        document.getElementById(context.mountedId).appendChild(dom)
        
        document.getElementById('editDiv' + context.timeSliderNums).onclick=function(event){
            var e=event||window.event;
            var target= e.target || e.srcElement; //获取document 对象的引用 

            if (target.className) {
				if (target.className == "editImg") {
                    var domArray1=getElementsByClassName('editContent','','div');
                    for(var i=0;i<domArray1.length;i++){
                        domArray1[i].style.display='none';
                    }
                    var domArray2=getElementsByClassName('editCBox'+context.timeSliderNums,'','input');
                    for(var i=0;i<domArray2.length;i++){
                       domArray2[i].checked=false;
                    }
                    getElementsByClassName('editCheckAll'+context.timeSliderNums,'','input')[0].checked=false;
                    document.getElementById('editCBox' + context.timeSliderNums + '_' + context.timeSliderNums).disabled=true;
					document.getElementById('editContent' + context.timeSliderNums).style.display = 'block';
				} else if (target.className == "delImg") {
					if (window.confirm(["Do you want to delete all time periods on this timeline?", "是否要删除此时间轴上的所有时间段"][lan])) {
                        removeAllTimeBlocks(context);
					}
				} else if (target.className == ('editCBox'+context.timeSliderNums)) { 
                    var checkedNums=0;
                    var domArray=getElementsByClassName('editCBox'+context.timeSliderNums);
                    for(var i=0;i<domArray.length;i++){
                       if(domArray[i].checked){
                           checkedNums++;
                       }
                    }
                    if(6==checkedNums){
                        getElementsByClassName('editCheckAll'+context.timeSliderNums,'','input')[0].checked=true;
                    }else{
                        getElementsByClassName('editCheckAll'+context.timeSliderNums,'','input')[0].checked=false;
                    }
				} else if (target.className == "editBtn save") {
					copyTimeSlider(1, context);
                    document.getElementById('editContent' + context.timeSliderNums).style.display='none';
				} else if (target.className == "editBtn cancel") {
					document.getElementById('editContent' + context.timeSliderNums).style.display='none';
				} else if (target.className == ('editCheckAll'+context.timeSliderNums)) {//全选
					var state = getElementsByClassName('editCheckAll'+context.timeSliderNums,'','input')[0].checked;
                    var domArray=getElementsByClassName('editCBox'+context.timeSliderNums,'','input');
                    for(var i=0;i<domArray.length;i++){
                       if(!domArray[i].disabled&&state){
                           domArray[i].checked=true;
                       }else if(!domArray[i].disabled&&!state){
                           domArray[i].checked=false;
                       }
                    }
				}
			}
        }
	}
    
    /*复制函数：
	flag为1是复制时全覆盖，0是选择性覆盖
	context为当前时间轴的this
	 */
	function copyTimeSlider(flag, context) {
		var self = context;
		for (var j = 1; j <= 7; j++) {
            if (document.getElementById('editCBox'+self.timeSliderNums + "_" + j).checked == true) {
				if (flag) {
					removeAllTimeBlocks(g_instanceCtxArray[j-1]);
				}
				for (var i = 0; i < self.timeBlockNums; i++) {
                    if(g_instanceCtxArray[j-1]){
                        g_instanceCtxArray[j-1].createTimeBlock({
                            startTime : self.startTimeArray[i],
                            stopTime : self.stopTimeArray[i],
                            info : self.infosArray[i]
                        })
                        g_instanceCtxArray[j-1].infosArray[i] = self.infosArray[i];
                    }
				}
			}
		}
	}
    
    
    /*删除当前时间轴上所有时间段
	context为当前时间轴的this
	 */
	function removeAllTimeBlocks(context) {
		var self = context;
        if(!self||0==self.timeBlockNums)return;
		var len = self.timeBlockNums;
        var doms=getElementsByClassName('timeSliderDiv','timeslider' + self.timeSliderNums);
        var domsLen=doms.length;
        for(var i=0;i<domsLen;i++){
            if(doms[i]){//IE8获取的dom是放入一个临时数组中，可以按索引一个个删除;
                doms[i].parentNode.removeChild(doms[i]);
            }else{
                doms[0].parentNode.removeChild(doms[0]);
            }
        }
		self.stopTimeCoordinateArray.splice(0, len);
		self.startTimeCoordinateArray.splice(0, len);
		self.startTimeArray.splice(0, len);
		self.stopTimeArray.splice(0, len);
		self.infosArray.splice(0, len);
		self.timeBlockNums = 0;
		self.curStartTime = 0;
		self.curStopTime = 0;
	}
    
    //单例模式实现
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
    
    
    TimeSlider.prototype.constructor = TimeSlider;
	window.TimeSlider = TimeSlider;
    
})()