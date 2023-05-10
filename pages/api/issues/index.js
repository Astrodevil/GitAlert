// api/issues

import { Octokit } from "octokit";
import fs from "fs";
import path from "path";
import {Novu} from "@novu/node";

export default async function handler(req, res) {
     const {send} = req.query;
  const octokit = new Octokit();
  const q = "is:open is:issue label:good-first-issue";
  
  const response = await octokit.request("GET /search/issues", { q });
  const results = response.data.items.map((item) => ({
    name: item.title,
    author: item.user.login,
    url: item.html_url,
    labels: item.labels.map((label) => label.name),
  }));
  const random = Math.floor(Math.random() * results.length +1);
  const issue = results[random];

  if (send) {
    const novu = new Novu(process.env.NOVU_API_KEY);

    const files = fs.readdirSync(path.resolve("data"));
    const users = files.map((file) => ({
      ...JSON.parse(fs.readFileSync(path.resolve("data", file), "utf8")),
      file,
    }));
    console.log(users);

    users.forEach((user) => {
      novu.trigger("test1", {
        to:{
          subscriberId: user.email,
          email: user.email,
        },
        payload:{
          name: user.name,
          title: issue.name,
          author: issue.author,
          labels: issue.labels.join(" ,"),
          url: issue.url,
        },
      });
    });
  }
  res.status(200).json(issue);
}