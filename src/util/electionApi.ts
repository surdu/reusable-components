import { electionApiProductionUrl } from "../constants/servers";
import {
  ElectionBallot,
  ElectionBallotMeta,
  ElectionScope,
  ElectionNewsFeed,
  ElectionMapScope,
  ElectionMapWinners,
} from "../types/Election";
import { APIInvocation, JSONFetch, makeJsonFetch } from "./api";

export type OptionWithID<K = number, N = string> = { id: K; name: N };

export interface ElectionScopeAPI {
  getCounties: () => APIInvocation<OptionWithID[]>;
  getLocalities: (countyId: number) => APIInvocation<OptionWithID[]>;
  getCountries: () => APIInvocation<OptionWithID[]>;
}

export interface ElectionMapAPI {
  getWinnerMap: (ballotId: number, scope: ElectionMapScope) => APIInvocation<ElectionMapWinners>;
}

export interface ElectionAPI extends ElectionScopeAPI, ElectionMapAPI {
  getBallot: (id: number, scope: ElectionScope) => APIInvocation<ElectionBallot>;
  getBallots: () => APIInvocation<ElectionBallotMeta[]>;
  getNewsFeed: (id: number) => APIInvocation<ElectionNewsFeed>;
}

const scopeToQuery = (scope: ElectionScope) => {
  switch (scope.type) {
    case "national":
      return { Division: "national" };
    case "diaspora":
      return { Division: "diaspora" };
    case "county":
      return { Division: "county", CountyId: scope.countyId };
    case "locality":
      return { Division: "locality", CountyId: scope.countyId, LocalityId: scope.localityId };
    case "diaspora_country":
      return { Division: "diaspora_country", CountryId: scope.countryId };
  }
};

export const makeElectionApi = (options?: {
  apiUrl?: string;
  fetch?: JSONFetch; // for optional mocking
}): ElectionAPI => {
  const fetch = options?.fetch ?? makeJsonFetch(options?.apiUrl ?? electionApiProductionUrl);
  return {
    getBallot: (id, scope) =>
      fetch("GET", "/ballot", {
        query: {
          BallotId: id,
          ...scopeToQuery(scope),
        },
      }),
    getBallots: () => fetch("GET", "/ballots"),
    getCounties: () => fetch("GET", "/counties"),
    getLocalities: (countyId) => fetch("GET", "/localities", { query: { CountyId: countyId } }),
    getCountries: () => fetch("GET", "/countries"),
    getNewsFeed: (id) => fetch("GET", "/news", { query: { BallotId: id } }),
    getWinnerMap: (ballotId: number, scope: ElectionMapScope) => {
      switch (scope.type) {
        case "national":
          return fetch("GET", "/winners/counties", { query: { BallotId: ballotId } });
        case "county":
          return fetch("GET", "/winners/localities", { query: { BallotId: ballotId, CountyId: scope.countyId } });
        case "diaspora":
          return fetch("GET", "/winners/countries", { query: { BallotId: ballotId } });
      }
    },
  };
};
