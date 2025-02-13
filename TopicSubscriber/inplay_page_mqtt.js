/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Solace Web Messaging API for JavaScript
 * Publish/Subscribe tutorial - Topic Subscriber
 * Demonstrates subscribing to a topic for direct messages and receiving messages
 */

/*jslint es6 browser devel:true*/
/*global solace*/
let table, subscriber, client;
let topic_name = "t2/match/InProgress/+/wagering/+/+";
window.onload = function () {
	client = new Paho.MQTT.Client(
		config.mqtt_host,
		config.mqtt_port,
		config.vpn + "3"
	);
	client.onConnectionLost = onConnectionLost;
	client.onMessageArrived = onMessageArrived;

	client.connect({
		userName: config.username,
		password: config.pass,
		onSuccess: onConnect,
		useSSL: true,
	});

	var topic_name_txt = document.getElementById("topic_name");
	topic_name_txt.innerHTML = topic_name;

	table = $("#odd_table").DataTable({ select: true });
	table.on("click", "tr", function () {
		var data = table.row(this).data();
	});
};
function onConnect() {
	// Once a connection has been made, make a subscription and send a message.
	showlog("onConnect");
	client.subscribe(topic_name, {
		onSuccess: successSub,
		onFailure: failSub,
	});
	client.subscribe("notice", {
		onSuccess: successNoti,
		onFailure: failSub,
	});
}
function onConnectionLost(responseObject) {
	if (responseObject.errorCode !== 0)
		showlog("onConnectionLost:" + responseObject.errorMessage);
}
function onMessageArrived(message) {
	showlog("onMessageArrived:" + message.payloadString);
	var temp = JSON.parse(message.payloadString);
	if (temp.clear) {
		table.clear().draw();
	} else {
		push_odd(temp);
	}
}
function successSub(responseObject) {
	showlog("Successfully subscribe to the topic " + topic_name);
	// console.log(responseObject);
}
function successNoti(responseObject) {
	showlog("Successfully subscribe to the topic notice");
	// console.log(responseObject);
}
function failSub(responseObject) {
	showlog("Cannot subscribe to the topic" + responseObject);
}

function iframeloaded() {}
function push_odd(match) {
	let { matchID, homeTeam, awayTeam, matchStatus, pool, lastupdated } = match;
	let datas = table
		.rows()
		.data()
		.map((y, index) => {
			return {
				index,
				matchID: y[0],
				homeTeam: y[1],
				awayTeam: y[2],
				matchStatus: y[3],
				poolcode: y[4],
				poolID: y[5],
				lastupdated: y[6],
			};
		})
		.toArray();

	pool.forEach((x) => {
		let existing_res = datas.filter((y) => {
			return y.matchID == matchID && y.poolcode == x.poolcode;
		});
		if (existing_res.length) {
			table
				.row(existing_res[0].index)
				.data([
					matchID,
					homeTeam,
					awayTeam,
					matchStatus,
					x.poolcode,
					x.poolID,
					lastupdated,
				])
				.draw(false);
		} else {
			table.row
				.add([
					matchID,
					homeTeam,
					awayTeam,
					matchStatus,
					x.poolcode,
					x.poolID,
					lastupdated,
				])
				.draw(false);
		}
	});
}
function showlog(line) {
	var now = new Date();
	var time = [
		("0" + now.getHours()).slice(-2),
		("0" + now.getMinutes()).slice(-2),
		("0" + now.getSeconds()).slice(-2),
	];
	var timestamp = "[" + time.join(":") + "] ";
	console.log(timestamp + line);
	var logTextArea = document.getElementById("log");
	logTextArea.value += timestamp + line + "\n";
	logTextArea.scrollTop = logTextArea.scrollHeight;
}
