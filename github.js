let request = require("request");
let cheerio = require("cheerio");
let fs = require("fs");
let $;
const { jsPDF } = require("jspdf");
let data = {};

request("https://github.com/topics", getTopicPage);

function getTopicPage(err, res, body) {
    if (!err) {
        $ = cheerio.load(body)
        let allTopicAnchor = $(".no-underline.d-flex.flex-column.flex-justify-center")
        let allTopicName = $(".f3.lh-condensed.text-center.Link--primary.mb-0.mt-1")

        for (let i = 0; i < allTopicAnchor.length; i++) {
            // console.log("https://github.com" + $(allTopicAnchor[i]).attr("href"));
            // console.log($(allTopicName[i]).text().trim());
            // saveTopicPage("https://github.com" + $(allTopicAnchor[i]).attr("href"), $(allTopicName[i]).text().trim());
            fs.mkdirSync($(allTopicName[i]).text().trim());
            getAllProjects("https://github.com" + $(allTopicAnchor[i]).attr("href"), $(allTopicName[i]).text().trim());
        }
    }
}



// function saveTopicPage(url, name) {
//     request(url, function (err, res, body) {
//         fs.writeFileSync(name + ".html", body);
//     })
// }

function getAllProjects(url, name) {
    request(url, function (err, res, body) {
        if (!err) {
            $ = cheerio.load(body)
            let allProjects = $(".f3.color-text-secondary.text-normal.lh-condensed a.text-bold")
            if (allProjects.length > 8) {
                allProjects = allProjects.slice(0, 8);
            }

            for (let i = 0; i < allProjects.length; i++) {
                let projectUrl = "https://github.com" + $(allProjects[i]).attr("href")
                let projectName = $(allProjects[i]).text().trim()
                // console.log(projectUrl)
                // console.log(name + " --> " + projectName)
                if (!data[name]) {
                    data[name] = [{projectName, projectUrl}]
                } else {
                    data[name].push({projectName, projectUrl})
                }
                getIssues(projectUrl, projectName, name);
            }
        }
    });
}

function getIssues(url, projectName, topicName) {
    request(url + "/issues", function (err, res, body) {
        $ = cheerio.load(body)
        let allIssues = $(".Link--primary.v-align-middle.no-underline.h4.js-navigation-open.markdown-title");
        
        for (let i = 0; i < allIssues.length; i++) {
            let issueTitle = $(allIssues[i]).text().trim();
            let issueUrl = "https://github.com" + $(allIssues[i]).attr("href");
            
            let idx = data[topicName].findIndex(function (e) {
                return e.projectName == projectName;
            });
            
            if (!data[topicName][idx]["issues"]) {
                data[topicName][idx]["issues"] = [{issueTitle, issueUrl}];
            } else {
                data[topicName][idx]["issues"].push({issueTitle, issueUrl});
            }
        }
        // fs.writeFileSync("data.json", JSON.stringify(data));
        pdfGenerator();
    });
}

function pdfGenerator() {
    for (x in data) {
        let tArr = data[x];
        for (y in tArr) {
            let pName = tArr[y].projectName;
            if (fs.existsSync(`${x}/${pName}.pdf`)) {
                fs.unlinkSync(`${x}/${pName}.pdf`)
            }
            const doc = new jsPDF();
            for (z in tArr[y].issues) {
                doc.text(tArr[y].issues[z].issueTitle, 10, 10 + 15 * z);
                doc.text(tArr[y].issues[z].issueUrl, 10, 15 + 15 * z);
            }
            doc.save(`${x}/${pName}.pdf`);
        }
    }
}