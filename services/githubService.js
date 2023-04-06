const utils = require("../utils/fetch");
const { fetchUser } = require("../models/users");

/**
 * Extracts only the necessary details required from the object returned by Github API
 * @param data {Object} - Object returned by Github API
 */

const extractPRdetails = (data) => {
  const allPRs = [];
  data.items.forEach(
    ({
      title,
      user,
      html_url: url,
      state,
      created_at: createdAt,
      updated_at: updatedAt,
      repository_url: repositoryUrl,
      labels,
      assignees,
    }) => {
      const allAssignees = assignees.map((object) => object.login);
      const allLabels = labels.map((object) => object.name);
      const repositoryUrlSplit = repositoryUrl.split("/");
      const repository = repositoryUrlSplit[repositoryUrlSplit.length - 1];
      allPRs.push({
        title,
        username: user.login,
        state,
        createdAt,
        updatedAt,
        repository,
        url,
        labels: allLabels,
        assignees: allAssignees,
      });
    }
  );
  return allPRs;
};

/**
 * Creates the custom API URL with the required params in the format
 * expected by Github
 * https://docs.github.com/en/free-pro-team@latest/rest/reference/search
 * @access private
 * @param searchParams {Object} - List of params to create github API URL
 * @param resultsOptions {Object} - Ordering and pagination of results
 */
const getGithubURL = (searchParams, resultsOptions = {}) => {
  const baseURL = config.get("githubApi.baseUrl");
  const issuesAndPRsPath = "/search/issues";

  const urlObj = new URL(baseURL);
  urlObj.pathname = issuesAndPRsPath;

  const defaultParams = {
    org: config.get("githubApi.org"),
    type: "pr",
  };

  const finalSearchParams = Object.assign({}, defaultParams, searchParams);

  const paramsObjArr = Object.entries(finalSearchParams);
  const paramsStrArr = paramsObjArr.map(([key, value]) => `${key}:${value}`);

  // The string that can be entrered as text on Github website for simple search
  const prsSearchText = paramsStrArr.join(" ");

  urlObj.searchParams.append("q", prsSearchText);

  // Manipulate returned results
  // e.g number of results, pagination, etc
  Object.entries(resultsOptions).forEach(([key, value]) => {
    urlObj.searchParams.append(key, value);
  });

  const createdURL = urlObj.href;
  return createdURL;
};

/** Create the fetch object to call on github url
 * @access private
 * @param url {string} - URL on github to call
 */
function getFetch(url, params = null, data = null, headers = null) {
  return utils.fetch(url, "get", params, data, headers);
}

/**
 * Create fetch call for GitHub APIs as an authenticated user
 * @param {*} url - url to fetch from
 * @param {*} params - query params to pass
 * @param {*} headers - requested headers
 * @returns response object
 */
function getFetchWithAuthToken(url, params = null, headers = null) {
  return utils.fetch(url, "get", params, null, headers);
}
/**
 * Fetches the pull requests in Real-Dev-Squad by user using GitHub API
 * @param username {string} - Username String
 */

const fetchPRsByUser = async (username) => {
  try {
    const { user } = await fetchUser({ username });
    const url = getGithubURL({
      author: user.github_id,
    });
    return getFetch(url);
  } catch (err) {
    logger.error(`Error while fetching pull requests: ${err}`);
    throw err;
  }
};

/**
 * Fetches the oldest open `per_page` requests
 */
const fetchStalePRs = async (perPage = 10, page = 1) => {
  try {
    const url = getGithubURL(
      {
        is: "open",
      },
      {
        sort: "created",
        order: "asc",
        per_page: perPage,
        page,
      }
    );
    return getFetch(url);
  } catch (err) {
    logger.error(`Error while fetching pull requests: ${err}`);
    throw err;
  }
};

/**
 * Fetches the latest `per_page` open PRs
 */
const fetchOpenPRs = async (perPage = 10, page = 1) => {
  try {
    const url = getGithubURL(
      {
        is: "open",
      },
      {
        sort: "created",
        order: "desc",
        per_page: perPage,
        page,
      }
    );
    return getFetch(url);
  } catch (err) {
    logger.error(`Error while fetching pull requests: ${err}`);
    throw err;
  }
};

/**
 * Fetches issues across all repositories in the ORG
 */
const fetchIssues = async () => {
  try {
    const baseURL = config.get("githubApi.baseUrl");
    const issues = "/issues";
    const urlObj = new URL(baseURL);
    urlObj.pathname = "orgs" + "/" + config.get("githubApi.org") + issues;
    const createdURL = urlObj.href;
    const res = await getFetchWithAuthToken(
      createdURL,
      {
        filter: "all",
      },
      {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer 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`,
        org: "Real-Dev-Squad",
      }
    );
    return res;
  } catch (err) {
    logger.error(`Error while fetching issues: ${err}`);
    throw err;
  }
};

module.exports = {
  fetchPRsByUser,
  fetchOpenPRs,
  fetchStalePRs,
  getFetch,
  extractPRdetails,
  fetchIssues,
};
