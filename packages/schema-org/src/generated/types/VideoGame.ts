import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVideoGame = {
	id: 'schema:VideoGame',
	name: 'VideoGame',
	label: 'VideoGame',
	comment:
		'A video game is an electronic game that involves human interaction with a user interface to generate visual feedback on a video device.',
	subClassOf: ['Game', 'CreativeWork', 'Thing', 'SoftwareApplication'],
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
			id: 'schema:cheatCode',
			name: 'cheatCode',
			label: 'cheatCode',
			comment: 'Cheat codes to the game.',
			rangeIncludes: ['CreativeWork'],
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
			id: 'schema:gameEdition',
			name: 'gameEdition',
			label: 'gameEdition',
			comment: 'The edition of a video game.',
			rangeIncludes: ['Text'],
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
			id: 'schema:gameServer',
			name: 'gameServer',
			label: 'gameServer',
			comment: 'The server on which  it is possible to play the game.',
			rangeIncludes: ['GameServer'],
		},
		{
			id: 'schema:gameTip',
			name: 'gameTip',
			label: 'gameTip',
			comment: 'Links to tips, tactics, etc.',
			rangeIncludes: ['CreativeWork'],
		},
		{
			id: 'schema:musicBy',
			name: 'musicBy',
			label: 'musicBy',
			comment: 'The composer of the soundtrack.',
			rangeIncludes: ['MusicGroup', 'Person'],
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
			id: 'schema:trailer',
			name: 'trailer',
			label: 'trailer',
			comment: 'The trailer of a movie or TV/radio series, season, episode, etc.',
			rangeIncludes: ['VideoObject'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVideoGame;
export const VideoGame = schemaOrgVideoGame;

export default schemaOrgVideoGame;
