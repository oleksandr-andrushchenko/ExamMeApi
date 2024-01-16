import { JsonController, Post, Body } from "routing-controllers";
import { Inject, Service } from "typedi";
import UserTransfer from "../transfer/user/UserTransfer";
import AuthService, { AuthTokens } from "../service/auth/AuthService";
import UserCredentialsTransfer from "../transfer/user/UserCredentialsTransfer";

@Service()
@JsonController('/auth')
export default class AuthController {

    constructor(
        @Inject() private readonly authService: AuthService,
    ) {
    }

    @Post('/register')
    public async register(@Body({ required: true }) transfer: UserTransfer): Promise<AuthTokens> {
        await this.authService.registerUser(transfer);

        return await this.authService.loginUser(transfer);
    }

    @Post('/login')
    public async login(@Body({ required: true }) transfer: UserCredentialsTransfer): Promise<AuthTokens> {
        return await this.authService.loginUser(transfer);
    }
}