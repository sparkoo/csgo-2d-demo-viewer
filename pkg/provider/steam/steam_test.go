package steam

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseOpenIdUrl(t *testing.T) {
	id, err := parseSteamId("https://steamcommunity.com/openid/id/76561197979904892")

	assert.Equal(t, "76561197979904892", id)
	assert.NoError(t, err)
}
