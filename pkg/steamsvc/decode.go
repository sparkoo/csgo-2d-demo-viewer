package steamsvc

import (
	"math/big"
	"regexp"

	"strings"
)

type errInvalidShareCode struct{}

func (e errInvalidShareCode) Error() string {
	return "share_code: invalid share code"
}

func isInvalidShareCodeError(err error) bool {
	_, ok := err.(errInvalidShareCode)
	return ok
}

// shareCodeData holds the decoded match data and encoded share code.
type shareCodeData struct {
	Encoded   string `json:"encoded"`
	OutcomeID uint64 `json:"outcomeID"`
	MatchID   uint64 `json:"matchID"`
	Token     uint32 `json:"token"`
}

// dictionary is used for the share code decoding.
const dictionary = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789"

// Used for share code decoding.
var bitmask64 uint64 = 18446744073709551615

// validate validates an string whether the format matches a valid share code.
func validate(code string) bool {
	var validateRe = regexp.MustCompile(`^CSGO(-?[\w]{5}){5}$`)
	return validateRe.MatchString(code)
}

// DecodeShareCode decodes the share code. Taken from ValvePython/csgo.
func decode(code string) (*shareCodeData, error) {
	if !validate(code) {
		return nil, &errInvalidShareCode{}
	}

	var re = regexp.MustCompile(`^CSGO|\-`)
	s := re.ReplaceAllString(code, "")
	s = reverse(s)

	bigNumber := big.NewInt(0)

	for _, c := range s {
		bigNumber = bigNumber.Mul(bigNumber, big.NewInt(int64(len(dictionary))))
		bigNumber = bigNumber.Add(bigNumber, big.NewInt(int64(strings.Index(dictionary, string(c)))))
	}

	a := swapEndianness(bigNumber)

	matchid := big.NewInt(0)
	outcomeid := big.NewInt(0)
	token := big.NewInt(0)

	matchid = matchid.And(a, big.NewInt(0).SetUint64(bitmask64))
	outcomeid = outcomeid.Rsh(a, 64)
	outcomeid = outcomeid.And(outcomeid, big.NewInt(0).SetUint64(bitmask64))
	token = token.Rsh(a, 128)
	token = token.And(token, big.NewInt(0xFFFF))

	shareCode := &shareCodeData{MatchID: matchid.Uint64(), OutcomeID: outcomeid.Uint64(), Token: uint32(token.Uint64()), Encoded: code}
	return shareCode, nil
}
func reverse(s string) (result string) {
	for _, v := range s {
		result = string(v) + result
	}
	return
}

// swapEndianness changes the byte order.
func swapEndianness(number *big.Int) *big.Int {
	result := big.NewInt(0)

	left := big.NewInt(0)
	rightTemp := big.NewInt(0)
	rightResult := big.NewInt(0)

	for i := 0; i < 144; i += 8 {
		left = left.Lsh(result, 8)
		rightTemp = rightTemp.Rsh(number, uint(i))
		rightResult = rightResult.And(rightTemp, big.NewInt(0xFF))
		result = left.Add(left, rightResult)
	}

	return result
}
