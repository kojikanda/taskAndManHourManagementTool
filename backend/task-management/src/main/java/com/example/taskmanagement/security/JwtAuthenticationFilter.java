package com.example.taskmanagement.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Authorizationヘッダーからトークンを取り出す
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // "Bearer " の7文字を除去してトークンを取得
        String token = authHeader.substring(7);

        // トークンからemailを取得
        String email = jwtUtil.extractEmail(token);

        // まだ認証されていない場合のみ処理
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // emailを元にユーザ詳細情報をロード
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            // トークンが有効なら認証情報をSecurityContextにセット
            if (jwtUtil.isTokenValid(token, userDetails.getUsername())) {
                // Spring Security が扱う「認証済みトークン」オブジェクトを作成
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                // リクエストの詳細情報（IPアドレスなど）を付加
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                // SecurityContext に認証情報をセット → 「このユーザは認証済み」と記録
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
