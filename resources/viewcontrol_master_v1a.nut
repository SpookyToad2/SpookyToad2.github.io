/*
================================================================================
  UNIFIED VIEWCONTROL SCRIPT - DEVELOPER GUIDE
  Based on Easy PVC Control by worMatty | Refactored by SpookyToad
================================================================================

  OVERVIEW
  --------
  Manages point_viewcontrol camera entities in TF2 VScript.
  Provides two independent systems that can be used separately or together:

    [A] SHARED CAMERA     - one entity shown to all (or one) players.
    [B] PER-PLAYER CAMERA - a separate camera spawned for each player,
                            so every player sees their own view simultaneously.
                            Supports path_corner-based cinematic movement.

  Both systems automatically:
    • Freeze players (FL_ATCONTROLS flag / AddFlag 128).
    • Make players invulnerable (m_takedamage = 0) while in camera view.
    • Save and restore each player's original damage & taunt-cam state.
    • Clean up automatically on round start, round win, and round end events.

  HOW TO SET UP
  -------------
  1. Attach this script to any entity (e.g. info_target, info_teleport_destination).
     That entity's ORIGIN and ANGLES become the camera's spawn position and direction.
  2. Call one of the SpawnAndEnable* functions to activate a camera.
  3. Call the matching Disable/Destroy function to deactivate it.

================================================================================
  QUICK REFERENCE - WHICH FUNCTION TO CALL?
================================================================================

  Show the same camera to EVERYONE:
    SpawnAndEnableAll()             ← spawn + enable for all players
    DisableAndDestroy()             ← release all players + kill camera

  Show a camera to ONE specific player only:
    SpawnAndEnable(hPlayer)         ← spawn + enable for one player
    DisableAndDestroy()             ← release all + kill camera
    - or -
    DisableCamera(hPlayer)          ← release just that player (camera stays)

  Give each player their OWN camera (cinematic / path_corner guided):
    SpawnAndEnablePerPlayer(...)    ← spawn one camera per player + enable
    DisableAndDestroyPerPlayer()    ← release all + kill all per-player cameras

================================================================================
  [A] SHARED CAMERA  (one camera entity for all or one player)
================================================================================

  SpawnAndEnableAll(hParent = null, szAttachment = null)
  ----------------------------------
  PURPOSE : "Turn on the camera for everyone."
            Spawns a single point_viewcontrol at this entity's origin/angles,
            then immediately switches ALL connected players to it.
  WHEN    : Every player should watch the same view simultaneously -
            e.g. a cinematic intro, boss-spawn cutscene, round-end replay.
  PARAMS  :
    hParent - (optional) Entity handle to parent the camera to.
              If the parent moves, the camera follows. null = static camera.
    szAttachment - (optional) String name of the attachment point on the parent.
  NOTES   : If a camera already exists it is destroyed first (safe to call
            multiple times). Internally: SpawnCamera() -> EnableCameraAll().


  SpawnAndEnable(hPlayer, hParent = null, szAttachment = null)
  ----------------------------------------
  PURPOSE : Same as SpawnAndEnableAll but only for ONE specific player.
  WHEN    : Only one player triggered the event and only they should see it,
            e.g. a player-triggered cutscene.
  PARAMS  :
    hPlayer - Handle of the player to show the camera to.
    hParent - (optional) Parent entity. Same as SpawnAndEnableAll.
    szAttachment - (optional) String name of the attachment point on the parent.


  DisableAndDestroy()
  -------------------
  PURPOSE : Shuts down the shared camera completely.
            Releases ALL players (restores damage/taunt-cam), then kills
            the point_viewcontrol entity.
  WHEN    : The cutscene/event is over and players should regain control.
            Also called automatically on round start/end - call manually
            only if you want to end the camera early mid-round.
  PARAMS  : None. Safe to call even if no camera exists.


  ── Lower-level shared helpers (usually not called directly) ──────────────

  SpawnCamera(hParent = null)
  ---------------------------
  Spawns the point_viewcontrol but does NOT enable it for any player.
  Useful for pre-spawning. Enable individually later with EnableCamera().

  EnableCamera(player)
  --------------------
  Switches one player to the already-spawned shared camera.
  Saves m_takedamage + ForceTauntCam, freezes, makes invulnerable,
  sets first-person, sends "Enable" input with player as activator.

  DisableCamera(player)
  ---------------------
  Releases one player from the shared camera. Unfreezes, restores saved
  state. Safe even if no saved state exists (uses fallback defaults).
  Also removes the "no_attack" attribute as a robustness measure.

  EnableCameraAll()       - Calls EnableCamera() on every connected player.
  DisableCameraAll()      - Calls DisableCamera() on every connected player.
  DestroyCamera()         - Sends Disable input then kills the entity.

================================================================================
  [B] PER-PLAYER CAMERA  (unique camera entity per player)
================================================================================

  SpawnAndEnablePerPlayer(hTarget, hMoveTo, flSpeed, flAccel, flDecel)
  ---------------------------------------------------------------------
  PURPOSE : "Give each player their own camera."
            Spawns a dedicated point_viewcontrol for EACH connected player.
            Each camera can look at a target and travel toward a destination,
            making this ideal for CINEMATIC cameras that follow a path_corner
            path - each player sees their own guided camera sequence.
  WHEN    : Per-player spawn cameras, personal intro sequences, or any scene
            where every player needs a unique simultaneous camera.
  PARAMS  :
    hTarget  - Entity handle OR targetname string the camera looks at.
               Pass null to ignore.
    hMoveTo  - Entity handle OR targetname string the camera moves toward
               after spawning (e.g. a path_corner entity). null = static.
    flSpeed  (default 100)  - Camera movement speed (units/sec).
    flAccel  (default 5000) - How fast the camera accelerates to flSpeed.
    flDecel  (default 5000) - How fast the camera decelerates when stopping.
  NOTES   : Camera spawns at the script entity's origin.
            Uses spawnflags 13:
              Bit 0 (1): Start at Player position
              Bit 2 (4): Freeze player  ← REQUIRED or the camera won't work
              Bit 3 (8): Infinite Hold Time
            Old per-player cameras are always cleaned up before spawning new ones.


  DisableAndDestroyPerPlayer()
  ----------------------------
  PURPOSE : Disables and destroys ALL per-player cameras.
            Restores every affected player's state. Clears tracking table.
  WHEN    : Per-player scene is finished. Also called automatically on all
            round start/end events - call manually to end cameras early.
  PARAMS  : None.


  ── Lower-level per-player helpers (normally not called directly) ─────────

  SpawnViewControlForPlayer(player, hTarget, hMoveTo, flSpeed, flAccel, flDecel)
    Spawns + enables a camera for a single player. Generates a unique
    targetname. Stores handle in hPlayerCameras[entindex].

  EnablePerPlayerCamera(player, camera)
    Applies per-player freeze/invuln/first-person constraints and sends
    "Enable". Uses a separate state key (viewcontrol_pp_saved_state) so
    it never conflicts with the shared camera system.

  DisablePerPlayerCamera(player, camera)
    Releases one player from their per-player camera. Restores saved state,
    removes freeze flag, re-enables local draw, removes "no_attack".

================================================================================
  AUTOMATIC CLEANUP (no action needed)
================================================================================

  The following game events automatically call DisableAndDestroy() AND
  DisableAndDestroyPerPlayer(), cleaning up all cameras:

    teamplay_round_start          - New round begins.
    teamplay_round_win            - A team wins the round.
    scorestats_accumulated_update - End-of-round stats screen.
    recalculate_holidays          - Fires at round end; only cleans up when
                                    round state is 8 (Round End) or 5 (Team Win).

================================================================================
*/

// ============================================================================
// Constants & Settings
// ============================================================================

const CAMERA_SPAWNFLAGS = 8; // Infinite Hold Time

// ============================================================================
// Script State
// ============================================================================

hCamera <- null;
hCameraParent <- null;
vecCameraOrigin <- null;
angCameraAngles <- null;

// ============================================================================
// Public Interface
// ============================================================================

/**
 * Spawns the camera and enables it for a specific player.
 * @param {handle} hPlayer - The player to enable the camera for.
 * @param {handle} hParent - Optional entity to parent the camera to.
 * @param {string} szAttachment - Optional attachment point name.
 */
function SpawnAndEnable(hPlayer, hParent = null, szAttachment = null)
{
	SpawnCamera(hParent, szAttachment);
	EnableCamera(hPlayer);
}

/**
 * Spawns the camera and enables it for all players.
 * @param {handle} hParent - Optional entity to parent the camera to.
 * @param {string} szAttachment - Optional attachment point name.
 */
function SpawnAndEnableAll(hParent = null, szAttachment = null)
{
	SpawnCamera(hParent, szAttachment);
	EnableCameraAll();
}

/**
 * Disables the camera for all players and destroys it.
 */
function DisableAndDestroy()
{
	DisableCameraAll();
	DestroyCamera();
}

/**
 * Spawns the point_viewcontrol entity at this entity's origin/angles.
 * @param {handle} hParent - Optional entity to parent the camera to. If null, no parent.
 * @param {string} szAttachment - Optional attachment point name.
 */
function SpawnCamera(hParent = null, szAttachment = null)
{
	if (hCamera != null && hCamera.IsValid())
	{
		// If camera exists, destroy it first to ensure clean state
		DestroyCamera();
	}

	hCameraParent = hParent;
	vecCameraOrigin = self.GetOrigin();
	angCameraAngles = self.GetAngles();

	hCamera = SpawnEntityFromTable("point_viewcontrol", {
		origin = vecCameraOrigin,
		angles = angCameraAngles,
		spawnflags = CAMERA_SPAWNFLAGS,
		targetname = self.GetName() + "_viewcontrol"
	});

	if (hParent != null && hParent.IsValid())
	{
		hCamera.AcceptInput("SetParent", "!activator", hParent, hParent);
		
		if (szAttachment != null && szAttachment != "")
		{
			hCamera.AcceptInput("SetParentAttachment", szAttachment, hParent, hParent);
		}
	}
}

/**
 * Destroys the camera entity.
 */
function DestroyCamera()
{
	if (hCamera != null && hCamera.IsValid())
	{
		hCamera.AcceptInput("Disable", "", player, player); // Ensure disabled
		hCamera.Kill();
	}
	hCamera = null;
}

/**
 * Switches a specific player to the camera.
 */
function EnableCamera(player)
{
	if (player == null || !player.IsValid() || !player.IsPlayer()) return;
	if (hCamera == null || !hCamera.IsValid()) return;

	player.ValidateScriptScope();
	local scope = player.GetScriptScope();

	// Store state
	if (!("viewcontrol_saved_state" in scope))
	{
		scope.viewcontrol_saved_state <- {
			m_takedamage = NetProps.GetPropInt(player, "m_takedamage"),
			m_nForceTauntCam = NetProps.GetPropInt(player, "m_nForceTauntCam")
		};
	}

	// Apply Viewcontrol Constraints
	player.AddFlag(128); // Freezes movement
	player.AddHudHideFlags(Constants.FHideHUD.HIDEHUD_HEALTH)
	
	// Invulnerability
	NetProps.SetPropInt(player, "m_takedamage", 0);

	// View Mode
	player.SetForcedTauntCam(0); // First person
	player.SetForceLocalDraw(true); // Draw own model

	// Enable Camera for this player
	hCamera.AcceptInput("Enable", "", player, null);
}

/**
 * Releases a specific player from the camera.
 */
function DisableCamera(player)
{
	if (player == null || !player.IsValid()) return;
	
	player.ValidateScriptScope();
	local scope = player.GetScriptScope();

	// Disable camera view for this player
	if (hCamera != null && hCamera.IsValid())
	{
		// store player's current lifestate locally so the camera functions for them
		local savedLifeState = NetProps.GetPropInt(player, "m_lifeState");
		NetProps.SetPropInt(player, "m_lifeState", 0);

		// set camera's user property to the player, then Disable the camera for them
		NetProps.SetPropEntity(hCamera, "m_hPlayer", player);
		hCamera.AcceptInput("Disable", "", player, player);

		// immediately restore lifestate
		NetProps.SetPropInt(player, "m_lifeState", savedLifeState);
	}

	// Restore State
	player.RemoveFlag(128);
	player.RemoveHudHideFlags(Constants.FHideHUD.HIDEHUD_HEALTH)
	player.SetForceLocalDraw(false);
    player.RemoveCustomAttribute("no_attack"); // Robustness from leftovers

	if ("viewcontrol_saved_state" in scope)
	{
		local saved = scope.viewcontrol_saved_state;
		if (player.IsAlive())
		{
			NetProps.SetPropInt(player, "m_takedamage", saved.m_takedamage);
		}
		player.SetForcedTauntCam(saved.m_nForceTauntCam);
		
		delete scope.viewcontrol_saved_state;
	}
	else
	{
		// Fallback
		if (player.IsAlive()) NetProps.SetPropInt(player, "m_takedamage", 2);
		player.SetForcedTauntCam(0);
	}
}

/**
 * Enables camera for all players.
 */
function EnableCameraAll()
{
	local maxclients = MaxClients();
	for (local i = 1; i <= maxclients; i++)
	{
		local player = PlayerInstanceFromIndex(i);
		if (player != null) EnableCamera(player);
	}
}

/**
 * Disables camera for all players.
 */
function DisableCameraAll()
{
	local maxclients = MaxClients();
	for (local i = 1; i <= maxclients; i++)
	{
		local player = PlayerInstanceFromIndex(i);
		if (player != null) DisableCamera(player);
	}
}

// ============================================================================
// Per-Player Viewcontrol System
// ============================================================================

hPlayerCameras <- {}; // Map: UserID -> Camera Handle

/**
 * Spawns a dedicated camera for each player and enables it.
 * @param {handle|string} hTarget - Entity/Name to look at (target).
 * @param {handle|string} hMoveTo - Entity/Name to move to (moveto).
 * @param {float} flSpeed - Movement speed.
 * @param {float} flAccel - Acceleration (default 5000).
 * @param {float} flDecel - Deceleration (default 5000).
 */
function SpawnAndEnablePerPlayer(hTarget = null, hMoveTo = null, flSpeed = 100, flAccel = 5000, flDecel = 5000)
{
	// Clean up any existing per-player cameras first
	DisableAndDestroyPerPlayer();

	local maxclients = MaxClients();
	for (local i = 1; i <= maxclients; i++)
	{
		local player = PlayerInstanceFromIndex(i);
		if (player != null && player.IsValid())
		{
			SpawnViewControlForPlayer(player, hTarget, hMoveTo, flSpeed, flAccel, flDecel);
		}
	}
}

/**
 * Spawns and enables a camera for a single player.
 */
function SpawnViewControlForPlayer(player, hTarget, hMoveTo, flSpeed, flAccel, flDecel)
{
	if (!player.IsValid()) return;

	// Resolve target name
	local szTargetName = "";
	if (typeof(hTarget) == "string") szTargetName = hTarget;
	else if (hTarget != null && hTarget.IsValid()) szTargetName = hTarget.GetName();

	// Resolve moveto name
	local szMoveToName = "";
	if (typeof(hMoveTo) == "string") szMoveToName = hMoveTo;
	else if (hMoveTo != null && hMoveTo.IsValid()) szMoveToName = hMoveTo.GetName();

	// Generate unique targetname
	local uniqueSuffix = "_" + player.entindex();
	local camName = self.GetName() + "_viewcontrol" + uniqueSuffix;

	local vecOrigin = self.GetOrigin();
	local angAngles = self.GetAngles();
	// if(Entities.FindByName(null, szMoveToName) != null)
	// {
	// 	vecOrigin = Entities.FindByName(null, szMoveToName).GetOrigin();
	// }
	// printl(vecOrigin);
	// printl(szMoveToName);
	// Spawn the camera
	local camera = SpawnEntityFromTable("point_viewcontrol", {
		origin = vecOrigin,
		angles = angAngles,
		spawnflags = 13, // 1 (Start at Player) + 8 (Infinite Hold Time) + 4 (Freeze player. VERY IMPORTANT OR IT WON'T WORK)
		acceleration = flAccel,
		deceleration = flDecel,
		speed = flSpeed,
		target = szTargetName,
		moveto = szMoveToName,
		targetname = camName
	});

	// Critical: Force purge fixedup strings to match standard entity behavior or prevent leaks
	NetProps.SetPropBool(camera, "m_bForcePurgeFixedupStrings", true);

	// Store in our tracking table
	hPlayerCameras[player.entindex()] <- camera;

	// Enable for this player
	EnablePerPlayerCamera(player, camera);
}

/**
 * Enables a specific camera for a specific player (Per-Player logic).
 * Separated from main EnableCamera to avoid conflicts.
 */
function EnablePerPlayerCamera(player, camera)
{
	if (player == null || !player.IsValid() || !player.IsPlayer()) return;
	if (camera == null || !camera.IsValid()) return;

	player.ValidateScriptScope();
	local scope = player.GetScriptScope();

	// Store state independently
	if (!("viewcontrol_pp_saved_state" in scope))
	{
		scope.viewcontrol_pp_saved_state <- {
			m_takedamage = NetProps.GetPropInt(player, "m_takedamage"),
			m_nForceTauntCam = NetProps.GetPropInt(player, "m_nForceTauntCam")
		};
	}

	// Apply Constraints
	player.AddFlag(128); // FL_ATCONTROLS (Freeze)
	player.AddHudHideFlags(Constants.FHideHUD.HIDEHUD_HEALTH)
	NetProps.SetPropInt(player, "m_takedamage", 0);
	player.SetForcedTauntCam(0);
	player.SetForceLocalDraw(true);

	// Enable Camera specifically for this player
	camera.AcceptInput("Enable", "", player, null);

	// Must be executed after camera got enabled due to freeze flag on viewcontrol (required to make "start from player" flag work) so player will be able to move freely
	player.RemoveFlag(Constants.FPlayer.FL_FROZEN)
}

/**
 * Disables all per-player cameras and destroys them.
 */
function DisableAndDestroyPerPlayer()
{
	foreach (idx, camera in hPlayerCameras)
	{
		local player = PlayerInstanceFromIndex(idx);
		
		// Disable and restore player state
		if (player != null && player.IsValid())
		{
			DisablePerPlayerCamera(player, camera);
		}
		
		// Destroy camera
		if (camera != null && camera.IsValid())
		{
			camera.AcceptInput("Disable", "", player, player);
			camera.Kill();
		}
	}
	hPlayerCameras.clear();
}

/**
 * Helper to disable camera for a player and restore state.
 */
function DisablePerPlayerCamera(player, camera)
{
	if (player == null || !player.IsValid()) return;
	
	player.ValidateScriptScope();
	local scope = player.GetScriptScope();

	// Disable input to camera
	if (camera != null && camera.IsValid())
	{
		// store player's current lifestate locally so the camera functions for them
		local savedLifeState = NetProps.GetPropInt(player, "m_lifeState");
		NetProps.SetPropInt(player, "m_lifeState", 0);

		// set camera's user property to the player, then Disable the camera for them
		NetProps.SetPropEntity(camera, "m_hPlayer", player);
		camera.AcceptInput("Disable", "", player, player);

		// immediately restore lifestate
		NetProps.SetPropInt(player, "m_lifeState", savedLifeState);
	}

	// Restore Player State
	player.RemoveFlag(128);
	player.RemoveHudHideFlags(Constants.FHideHUD.HIDEHUD_HEALTH)
	player.SetForceLocalDraw(false);
	player.RemoveCustomAttribute("no_attack");

	if ("viewcontrol_pp_saved_state" in scope)
	{
		local saved = scope.viewcontrol_pp_saved_state;
		if (player.IsAlive())
		{
			NetProps.SetPropInt(player, "m_takedamage", saved.m_takedamage);
		}
		player.SetForcedTauntCam(saved.m_nForceTauntCam);
		
		delete scope.viewcontrol_pp_saved_state;
	}
	else
	{
		// Fallback defaults
		if (player.IsAlive()) NetProps.SetPropInt(player, "m_takedamage", 2);
		player.SetForcedTauntCam(0);
	}
}

// ============================================================================
// Event Hooks for Cleanup
// ============================================================================

// This handles all the dirty work, just copy paste it into your code
function CollectEventsInScope(events)
{
	local events_id = UniqueString()
	getroottable()[events_id] <- events

	foreach (name, callback in events)
		events[name] = callback.bindenv(this)

	local cleanup_user_func, cleanup_event = "OnGameEvent_scorestats_accumulated_update"
	if (cleanup_event in events)
		cleanup_user_func = events[cleanup_event]

	events[cleanup_event] <- function(params)
	{
		if (cleanup_user_func)
			cleanup_user_func(params)

		delete getroottable()[events_id]
	}
	__CollectGameEventCallbacks(events)
}

CollectEventsInScope
({

    OnGameEvent_teamplay_round_start = function(params) 
    { 
		printl(self.GetName() + " - Round Start Event Detected - Cleaning up cameras");
        DisableAndDestroy();
        DisableAndDestroyPerPlayer();
    },
    OnGameEvent_teamplay_round_win = function(params) 
    {
		printl(self.GetName() + " - Round Win Event Detected - Cleaning up cameras");
        DisableAndDestroy();
        DisableAndDestroyPerPlayer();
    },
    OnGameEvent_scorestats_accumulated_update = function(params) 
    { 
		printl(self.GetName() + " - End of Round Event Detected - Cleaning up cameras");
        DisableAndDestroy();
        DisableAndDestroyPerPlayer();
    },
    OnGameEvent_recalculate_holidays = function(params)
    {
		printl(self.GetName() + " - Recalculate Holidays Event Detected - Checking round state for cleanup");
        // 8 = Round End, 5 = Team Win (Arena often uses 5)
        local state = GetRoundState();
        if (state == 8 || state == 5)
        {
            DisableAndDestroy();
            DisableAndDestroyPerPlayer();
        }
    }
})