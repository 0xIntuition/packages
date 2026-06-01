import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVideoGameSeries = {
	id: 'schema:VideoGameSeries',
	name: 'VideoGameSeries',
	label: 'VideoGameSeries',
	comment: 'A video game series.',
	subClassOf: ['CreativeWorkSeries', 'CreativeWork', 'Thing', 'Series', 'Intangible'],
	properties: [
		{
			id: 'schema:actor',
			name: 'actor',
			label: 'actor',
			comment:
				'An actor (individual or a group), e.g. in TV, radio, movie, video games etc., or in an event. Actors can be associated with individual items or with a series, episode, clip.',
			rangeIncludes: ['PerformingGroup', 'Person'],
		},
		{
			id: 'schema:actors',
			name: 'actors',
			label: 'actors',
			comment:
				'An actor, e.g. in TV, radio, movie, video games etc. Actors can be associated with individual items or with a series, episode, clip.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:characterAttribute',
			name: 'characterAttribute',
			label: 'characterAttribute',
			comment:
				'A piece of data that represents a particular aspect of a fictional character (skill, power, character points, advantage, disadvantage).',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:cheatCode',
			name: 'cheatCode',
			label: 'cheatCode',
			comment: 'Cheat codes to the game.',
			rangeIncludes: ['CreativeWork'],
		},
		{
			id: 'schema:containsSeason',
			name: 'containsSeason',
			label: 'containsSeason',
			comment: 'A season that is part of the media series.',
			rangeIncludes: ['CreativeWorkSeason'],
		},
		{
			id: 'schema:director',
			name: 'director',
			label: 'director',
			comment:
				'A director of e.g. TV, radio, movie, video gaming etc. content, or of an event. Directors can be associated with individual items or with a series, episode, clip.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:directors',
			name: 'directors',
			label: 'directors',
			comment:
				'A director of e.g. TV, radio, movie, video games etc. content. Directors can be associated with individual items or with a series, episode, clip.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:episode',
			name: 'episode',
			label: 'episode',
			comment: 'An episode of a TV, radio or game media within a series or season.',
			rangeIncludes: ['Episode'],
		},
		{
			id: 'schema:episodes',
			name: 'episodes',
			label: 'episodes',
			comment: 'An episode of a TV/radio series or season.',
			rangeIncludes: ['Episode'],
		},
		{
			id: 'schema:gameItem',
			name: 'gameItem',
			label: 'gameItem',
			comment:
				'An item is an object within the game world that can be collected by a player or, occasionally, a non-player character.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:gameLocation',
			name: 'gameLocation',
			label: 'gameLocation',
			comment: 'Real or fictional location of the game (or part of game).',
			rangeIncludes: ['Place', 'PostalAddress', 'URL'],
		},
		{
			id: 'schema:gamePlatform',
			name: 'gamePlatform',
			label: 'gamePlatform',
			comment:
				'The electronic systems used to play <a href="http://en.wikipedia.org/wiki/Category:Video_game_platforms">video games</a>.',
			rangeIncludes: ['Text', 'Thing', 'URL'],
		},
		{
			id: 'schema:musicBy',
			name: 'musicBy',
			label: 'musicBy',
			comment: 'The composer of the soundtrack.',
			rangeIncludes: ['MusicGroup', 'Person'],
		},
		{
			id: 'schema:numberOfEpisodes',
			name: 'numberOfEpisodes',
			label: 'numberOfEpisodes',
			comment: 'The number of episodes in this season or series.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:numberOfPlayers',
			name: 'numberOfPlayers',
			label: 'numberOfPlayers',
			comment: 'Indicate how many people can play this game (minimum, maximum, or range).',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:numberOfSeasons',
			name: 'numberOfSeasons',
			label: 'numberOfSeasons',
			comment: 'The number of seasons in this series.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:playMode',
			name: 'playMode',
			label: 'playMode',
			comment:
				'Indicates whether this game is multi-player, co-op or single-player.  The game can be marked as multi-player, co-op and single-player at the same time.',
			rangeIncludes: ['GamePlayMode'],
		},
		{
			id: 'schema:productionCompany',
			name: 'productionCompany',
			label: 'productionCompany',
			comment:
				'The production company or studio responsible for the item, e.g. series, video game, episode etc.',
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:quest',
			name: 'quest',
			label: 'quest',
			comment:
				'The task that a player-controlled character, or group of characters may complete in order to gain a reward.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:season',
			name: 'season',
			label: 'season',
			comment: 'A season in a media series.',
			rangeIncludes: ['CreativeWorkSeason', 'URL'],
		},
		{
			id: 'schema:seasons',
			name: 'seasons',
			label: 'seasons',
			comment: 'A season in a media series.',
			rangeIncludes: ['CreativeWorkSeason'],
		},
		{
			id: 'schema:trailer',
			name: 'trailer',
			label: 'trailer',
			comment: 'The trailer of a movie or TV/radio series, season, episode, etc.',
			rangeIncludes: ['VideoObject'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVideoGameSeries;
export const VideoGameSeries = schemaOrgVideoGameSeries;

export default schemaOrgVideoGameSeries;
